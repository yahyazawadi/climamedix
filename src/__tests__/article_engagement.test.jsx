import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ArticleReaderPage } from '../features/news-blog/components/ArticleReaderPage';
import { supabase } from '../utils/supabaseClient';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}));

// Mock Supabase
vi.mock('../utils/supabaseClient', () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();
  const mockAuth = {
    getUser: vi.fn()
  };

  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
      auth: mockAuth
    }
  };
});

describe('Stage 4: Article Engagement, Reactions & Author Permissions Test Suite', () => {
  const sampleArticle = {
    id: 'art-101',
    title_ar: 'تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي',
    title_en: 'Impact of Rising Temperatures on Respiratory Health',
    content_ar: '<p>محتوى المقال الطبي المفصل حول التغير المناخي والربو.</p>',
    content_en: '<p>Detailed medical content on climate change and asthma.</p>',
    published_at: '2026-09-01T10:00:00Z',
    views_count: 42,
    likes_count: 7,
    created_by: 'author-user-id'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, '', '?id=art-101');
    window.alert = vi.fn();
  });

  function setupSupabaseMocks({ initialUser = null, userLiked = false } = {}) {
    supabase.auth.getUser.mockResolvedValue({
      data: { user: initialUser }
    });

    supabase.rpc.mockResolvedValue({ data: null, error: null });

    supabase.from.mockImplementation((table) => {
      if (table === 'news_articles_accessible') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { ...sampleArticle },
                error: null
              })
            })
          })
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { avatar_url: 'https://avatar.test/pic.png' },
                error: null
              })
            })
          })
        };
      }
      if (table === 'article_reactions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: userLiked ? { user_id: initialUser?.id } : null,
                  error: null
                })
              })
            })
          }),
          insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          })
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis()
      };
    });
  }

  it('Renders article, increments view count on mount, and invokes increment_article_view RPC', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: () => false
    });

    setupSupabaseMocks({ initialUser: null, userLiked: false });

    render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);

    // Article title should be rendered
    expect(await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي')).toBeInTheDocument();

    // RPC called
    expect(supabase.rpc).toHaveBeenCalledWith('increment_article_view', { article_id: 'art-101' });

    // Initial views_count was 42 -> displayed should be 43 (optimistic mount increment)
    expect(screen.getByText('43')).toBeInTheDocument();
    // Initial likes_count was 7
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('Guest User: Clicking Like triggers alert to sign in and does NOT insert reaction', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      hasPermission: () => false
    });

    setupSupabaseMocks({ initialUser: null, userLiked: false });

    render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);

    await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي');

    const likeButton = screen.getByTitle('الإعجابات');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('يرجى تسجيل الدخول أولاً للإعجاب');
    });
    // Likes count must stay 7
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('Authenticated User: Toggling Like button inserts reaction and increments count to 8', async () => {
    const loggedInUser = { id: 'reader-1', email: 'reader@climamedix.org' };

    mockUseAuth.mockReturnValue({
      user: loggedInUser,
      hasPermission: () => false
    });

    setupSupabaseMocks({ initialUser: loggedInUser, userLiked: false });

    render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);

    await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي');
    expect(screen.getByText('7')).toBeInTheDocument();

    const likeButton = screen.getByTitle('الإعجابات');
    await fireEvent.click(likeButton);

    // Likes count should increment to 8
    await waitFor(() => {
      expect(screen.getByText('8')).toBeInTheDocument();
    });

    // Supabase reactions table should have been called with insert
    expect(supabase.from).toHaveBeenCalledWith('article_reactions');
  });

  it('Edit Article Button: NOT visible to general readers or unprivileged users', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'different-user-999', email: 'other@test.com' },
      hasPermission: () => false // No write:articles, no manage:any_article
    });

    setupSupabaseMocks({ initialUser: { id: 'different-user-999' }, userLiked: false });

    render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);

    await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي');

    // Neither edit button should exist
    expect(screen.queryAllByTitle('تعديل المقال')).toHaveLength(0);
  });

  it('Edit Article Button: VISIBLE to the author with write:articles permission', async () => {
    const authorUser = { id: 'author-user-id', email: 'author@climamedix.org' };

    mockUseAuth.mockReturnValue({
      user: authorUser,
      hasPermission: (perm) => perm === 'write:articles'
    });

    setupSupabaseMocks({ initialUser: authorUser, userLiked: false });

    const onNavigate = vi.fn();
    render(<ArticleReaderPage lang="ar" onNavigate={onNavigate} />);

    await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي');

    const editBtns = screen.getAllByTitle('تعديل المقال');
    expect(editBtns.length).toBe(2); // Top header button + share bar button

    fireEvent.click(editBtns[0]);
    expect(onNavigate).toHaveBeenCalledWith('write-article', 'id=art-101');
  });

  it('Edit Article Button: VISIBLE to an editor with manage:any_article permission even if not the author', async () => {
    const editorUser = { id: 'editor-99', email: 'editor@climamedix.org' };

    mockUseAuth.mockReturnValue({
      user: editorUser,
      hasPermission: (perm) => perm === 'manage:any_article'
    });

    setupSupabaseMocks({ initialUser: editorUser, userLiked: false });

    render(<ArticleReaderPage lang="ar" onNavigate={vi.fn()} />);

    await screen.findByText('تأثير درجات الحرارة المرتفعة على صحة الجهاز التنفسي');

    const editBtns = screen.getAllByTitle('تعديل المقال');
    expect(editBtns.length).toBe(2);
  });
});
