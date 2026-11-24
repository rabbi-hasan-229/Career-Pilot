import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRpc, mockFrom, mockStorageFrom } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockFrom: vi.fn(),
  mockStorageFrom: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  isSupabaseConfigured: () => true,
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
    storage: {
      from: mockStorageFrom,
    },
  },
}));

import { expertRepository, validateExpertCVFile, validateExpertResourceFile } from './expertRepository';

describe('expertRepository & CV validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates CV file MIME type and 5MB size limit', () => {
    const validPdf = new File(['%PDF-1.4'], 'resume.pdf', { type: 'application/pdf' });
    expect(validateExpertCVFile(validPdf)).toBeNull();

    const badExt = new File(['hello'], 'script.exe', { type: 'application/x-msdownload' });
    expect(validateExpertCVFile(badExt)).toContain('Upload a PDF or Word');

    const oversized = new File([new Uint8Array(6 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
    expect(validateExpertCVFile(oversized)).toContain('5 MB or smaller');
  });

  it('books an expert session through the atomic book_expert_session RPC with SSLCOMMERZ details', async () => {
    mockRpc.mockResolvedValue({
      data: {
        booking: {
          id: 'bk-1',
          expert_id: 'exp-1',
          hours: 2,
          gross_amount_cents: 13000,
          expert_payout_cents: 11700,
          status: 'pending_confirmation',
          payment_status: 'escrow_held',
          payment_method: 'SSLCOMMERZ · bKash (4242)',
          payment_reference: 'SSL123456ABCD',
        },
      },
      error: null,
    });

    const result = await expertRepository.bookSession({
      expertId: 'exp-1',
      hours: 2,
      meetingMode: 'online',
      scheduledStartIso: '2027-01-04T10:00:00.000Z',
      timezone: 'UTC',
      topic: 'System design walkthrough',
      paymentMethod: 'SSLCOMMERZ · bKash (4242)',
      paymentReference: 'SSL123456ABCD',
    });

    expect(mockRpc).toHaveBeenCalledWith('book_expert_session', expect.objectContaining({
      p_expert_id: 'exp-1',
      p_hours: 2,
      p_meeting_mode: 'online',
      p_topic: 'System design walkthrough',
      p_payment_method: 'SSLCOMMERZ · bKash (4242)',
      p_payment_reference: 'SSL123456ABCD',
    }));
    expect(result.booking.payment_status).toBe('escrow_held');
    expect(result.booking.payment_method).toBe('SSLCOMMERZ · bKash (4242)');
  });

  it('releases escrow on learner confirmation and processes withdrawal atomically', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: {
          id: 'bk-1',
          status: 'completed',
          payment_status: 'released_to_expert',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          withdrawal: {
            id: 'wd-1',
            amount_cents: 5000,
            status: 'paid',
            reference_code: 'WD-ABC1234567',
          },
          wallet: {
            expert_id: 'exp-1',
            available_balance_cents: 6700,
            pending_escrow_cents: 0,
            total_earned_cents: 11700,
            total_withdrawn_cents: 5000,
          },
        },
        error: null,
      });

    const confirmed = await expertRepository.learnerConfirmSession('bk-1');
    expect(confirmed.payment_status).toBe('released_to_expert');

    const wd = await expertRepository.requestWithdrawal('pm-1', 5000);
    expect(mockRpc).toHaveBeenLastCalledWith('request_expert_withdrawal', {
      p_payout_method_id: 'pm-1',
      p_amount_cents: 5000,
    });
    expect(wd.withdrawal.status).toBe('paid');
    expect(wd.wallet.available_balance_cents).toBe(6700);
  });

  it('falls back cleanly when expert tables are not yet in the Supabase schema cache (PGRST205)', async () => {
    const schemaErr = {
      code: 'PGRST205',
      message: "Could not find the table 'public.expert_bookings' in the schema cache",
    };
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: schemaErr }),
    };
    // Make `order` awaitable for listActiveExperts / loadLearnerBookings
    (chain.order as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      order: vi.fn().mockResolvedValue({ data: null, error: schemaErr }),
      then: (resolve: (val: unknown) => void) => resolve({ data: null, error: schemaErr }),
    }));
    mockFrom.mockReturnValue(chain);

    const migrated = await expertRepository.isExpertMarketplaceMigrated();
    expect(migrated).toBe(false);

    const experts = await expertRepository.listActiveExperts(false);
    expect(experts.length).toBeGreaterThan(0);

    const bookings = await expertRepository.loadLearnerBookings('user-1');
    expect(bookings).toEqual([]);
  });

  it('validates expert resource files (15MB limit) and loads unlocked resources after purchase', async () => {
    const okFile = new File(['playbook'], 'playbook.pdf', { type: 'application/pdf' });
    expect(validateExpertResourceFile(okFile)).toBeNull();

    const tooLarge = new File([new Uint8Array(16 * 1024 * 1024)], 'huge.zip', { type: 'application/zip' });
    expect(validateExpertResourceFile(tooLarge)).toContain('15 MB or smaller');

    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: 'res-1',
          expert_id: 'exp-1',
          title: 'Architecture Playbook',
          description: 'Checklist',
          resource_type: 'file',
          file_name: 'playbook.pdf',
          file_size_bytes: 1024,
          created_at: '2026-11-23T00:00:00Z',
        },
      ],
      error: null,
    });
    const previews = await expertRepository.listExpertResourcePreviews('exp-1', false);
    expect(previews).toHaveLength(1);
    expect(previews[0].title).toBe('Architecture Playbook');

    const chain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'res-1',
            expert_id: 'exp-1',
            title: 'Architecture Playbook',
            description: 'Checklist',
            resource_type: 'file',
            storage_path: 'exp-1/playbook.pdf',
            file_name: 'playbook.pdf',
            file_size_bytes: 1024,
            created_at: '2026-11-23T00:00:00Z',
          },
        ],
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);
    const unlocked = await expertRepository.listUnlockedResourcesForExperts(['exp-1'], false);
    expect(unlocked).toHaveLength(1);
    expect(unlocked[0].storage_path).toBe('exp-1/playbook.pdf');
  });

  it('loads, sends, and summarizes latest session messages across learner and expert bookings', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'msg-2',
            booking_id: 'bk-1',
            sender_id: 'learner-1',
            sender_name: 'Ada',
            message: 'Shared my GitHub link!',
            created_at: '2026-11-23T12:10:00Z',
          },
          {
            id: 'msg-1',
            booking_id: 'bk-1',
            sender_id: 'exp-1',
            sender_name: 'Mentor',
            message: 'Welcome!',
            created_at: '2026-11-23T12:00:00Z',
          },
        ],
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain);

    const latest = await expertRepository.loadLatestSessionMessages(['bk-1']);
    expect(latest['bk-1']?.id).toBe('msg-2');
    expect(latest['bk-1']?.message).toBe('Shared my GitHub link!');

    const insertChain = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'msg-3',
          booking_id: 'bk-1',
          sender_id: 'exp-1',
          sender_name: 'Mentor',
          message: 'See you at 3 PM',
          created_at: '2026-11-23T12:15:00Z',
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(insertChain);
    const saved = await expertRepository.sendSessionMessage('bk-1', 'exp-1', 'Mentor', '  See you at 3 PM  ');
    expect(saved.message).toBe('See you at 3 PM');
    await expect(expertRepository.sendSessionMessage('bk-1', 'exp-1', 'Mentor', '   ')).rejects.toThrow('Enter a message first.');

    const incrementalChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'msg-3',
            booking_id: 'bk-1',
            sender_id: 'exp-1',
            sender_name: 'Mentor',
            message: 'See you at 3 PM',
            created_at: '2026-11-23T12:15:00Z',
          },
        ],
        error: null,
      }),
    };
    mockFrom.mockReturnValue(incrementalChain);
    const delta = await expertRepository.loadSessionMessages('bk-1', '2026-11-23T12:15:00Z');
    expect(incrementalChain.gte).toHaveBeenCalledWith('created_at', '2026-11-23T12:15:00Z');
    expect(delta).toHaveLength(1);
    expect(delta[0].id).toBe('msg-3');
  });
});
