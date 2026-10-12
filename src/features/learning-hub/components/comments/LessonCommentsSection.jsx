import { useState, useEffect } from 'preact/hooks';
import {
  fetchLessonComments,
  postLessonComment,
  updateLessonComment,
  deleteLessonComment,
  toggleCommentHeart
} from '../../services/lmsService';

export function LessonCommentsSection({
  lang = 'ar',
  courseId,
  lessonId,
  userId,
  userProfile,
  isEnrolled = false
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCommentText, setNewCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingToId, setReplyingToId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (!lessonId || !isEnrolled) {
      setComments([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchLessonComments(lessonId, userId)
      .then(data => {
        if (isMounted) {
          setComments(data || []);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('Failed to load lesson comments:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [lessonId, isEnrolled, userId]);

  // Handle posting root comment
  async function handleSubmitComment(e) {
    e?.preventDefault();
    if (!newCommentText.trim() || submitting || !userId || !isEnrolled) return;

    try {
      setSubmitting(true);
      const created = await postLessonComment({
        courseId,
        lessonId,
        userId,
        content: newCommentText
      });
      setComments(prev => [...prev, created]);
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      alert(isRtl ? 'تعذر إرسال التعليق. يرجى المحاولة لاحقاً.' : 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle posting reply
  async function handleSubmitReply(parentId) {
    if (!replyText.trim() || submitting || !userId || !isEnrolled) return;

    try {
      setSubmitting(true);
      const created = await postLessonComment({
        courseId,
        lessonId,
        userId,
        content: replyText,
        parentId
      });
      setComments(prev => [...prev, created]);
      setReplyingToId(null);
      setReplyText('');
    } catch (err) {
      console.error('Failed to post reply:', err);
      alert(isRtl ? 'تعذر إرسال الرد.' : 'Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  }

  // Handle edit save
  async function handleSaveEdit(commentId) {
    if (!editText.trim()) return;
    try {
      await updateLessonComment(commentId, userId, editText);
      setComments(prev =>
        prev.map(c => (c.id === commentId ? { ...c, content: editText } : c))
      );
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('Failed to update comment:', err);
      alert(isRtl ? 'تعذر تعديل التعليق.' : 'Failed to edit comment.');
    }
  }

  // Handle delete
  async function handleDeleteComment(commentId) {
    const confirmMsg = isRtl
      ? 'هل أنت متأكد من حذف هذا التعليق؟'
      : 'Are you sure you want to delete this comment?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteLessonComment(commentId, userId);
      setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(isRtl ? 'تعذر حذف التعليق.' : 'Failed to delete comment.');
    }
  }

  // Handle Heart Toggle
  async function handleToggleHeart(commentId, currentIsHearted) {
    if (!userId || !isEnrolled) return;

    // Optimistic UI update
    setComments(prev =>
      prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            isHearted: !currentIsHearted,
            heartCount: currentIsHearted ? Math.max(0, c.heartCount - 1) : c.heartCount + 1
          };
        }
        return c;
      })
    );

    try {
      await toggleCommentHeart(commentId, userId, currentIsHearted);
    } catch (err) {
      console.error('Failed to toggle heart:', err);
      // Revert on error
      setComments(prev =>
        prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isHearted: currentIsHearted,
              heartCount: currentIsHearted ? c.heartCount + 1 : Math.max(0, c.heartCount - 1)
            };
          }
          return c;
        })
      );
    }
  }

  // Time formatter
  function formatCommentDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Group top-level comments and replies
  const rootComments = comments.filter(c => !c.parent_id);
  const repliesByParent = {};
  comments.forEach(c => {
    if (c.parent_id) {
      if (!repliesByParent[c.parent_id]) repliesByParent[c.parent_id] = [];
      repliesByParent[c.parent_id].push(c);
    }
  });

  return (
    <div
      className="cdm-comments-section"
      style={{
        marginTop: '36px',
        paddingTop: '28px',
        borderTop: '1px solid rgba(11, 40, 73, 0.08)',
        direction: isRtl ? 'rtl' : 'ltr',
        textAlign: isRtl ? 'right' : 'left',
        fontFamily: "'Tajawal', system-ui, -apple-system, sans-serif"
      }}
    >
      <style>{`
        .cdm-comments-section,
        .cdm-comments-section * {
          font-family: 'Tajawal', system-ui, -apple-system, sans-serif !important;
        }
        .cdm-comments-section textarea::placeholder {
          font-family: 'Tajawal', system-ui, -apple-system, sans-serif !important;
          color: rgba(11, 40, 73, 0.45);
          font-size: 13.5px;
          opacity: 1;
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0b2849"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h4
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#0b2849'
            }}
          >
            {isRtl ? 'النقاشات والأسئلة حول الدرس' : 'Lesson Discussion & Questions'}
          </h4>
          <span
            style={{
              background: 'rgba(11, 40, 73, 0.06)',
              color: '#0b2849',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '2px 8px',
              borderRadius: '12px'
            }}
          >
            {comments.length}
          </span>
        </div>
      </div>

      {/* Non-Enrolled Gate */}
      {!isEnrolled ? (
        <div
          style={{
            padding: '24px',
            background: 'rgba(11, 40, 73, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(11, 40, 73, 0.08)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(11, 40, 73, 0.4)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0b2849' }}>
            {isRtl
              ? 'النقاشات مخصصة فقط للطلاب المسجلين في هذا المساق'
              : 'Discussions are exclusively available to enrolled students'}
          </div>
          <div style={{ fontSize: '12.5px', color: 'rgba(11, 40, 73, 0.6)' }}>
            {isRtl
              ? 'سجّل في المساق لتتمكن من طرح أسئلتك، والتفاعل مع زملائك والمحاضرين.'
              : 'Enroll in the course to participate in discussions and interact with instructors.'}
          </div>
        </div>
      ) : (
        <>
          {/* New Comment Input Box */}
          <form
            onSubmit={handleSubmitComment}
            style={{
              marginBottom: '28px',
              background: 'rgba(11, 40, 73, 0.02)',
              border: '1px solid rgba(11, 40, 73, 0.08)',
              borderRadius: '14px',
              padding: '16px'
            }}
          >
            <textarea
              value={newCommentText}
              onInput={e => setNewCommentText(e.target.value)}
              placeholder={
                isRtl
                  ? 'لديك سؤال أو ملاحظة حول محتوى هذا الدرس؟ اكتب هنا...'
                  : 'Have a question or note about this lesson? Write here...'
              }
              rows={3}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid rgba(11, 40, 73, 0.12)',
                borderRadius: '10px',
                padding: '12px 14px',
                fontSize: '14px',
                color: '#0b2849',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '10px'
              }}
            >
              <button
                type="submit"
                disabled={submitting || !newCommentText.trim()}
                style={{
                  background: 'linear-gradient(90deg, #0b2849 0%, #004c6d 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: submitting || !newCommentText.trim() ? 'not-allowed' : 'pointer',
                  opacity: submitting || !newCommentText.trim() ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>{isRtl ? 'إرسال التعليق' : 'Post Comment'}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }}
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </form>

          {/* Comments List */}
          {loading ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: 'rgba(11, 40, 73, 0.5)',
                fontSize: '13px'
              }}
            >
              {isRtl ? 'جارٍ تحميل النقاشات...' : 'Loading discussions...'}
            </div>
          ) : rootComments.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '30px 16px',
                color: 'rgba(11, 40, 73, 0.5)',
                fontSize: '13.5px',
                background: 'rgba(11, 40, 73, 0.02)',
                borderRadius: '12px'
              }}
            >
              {isRtl
                ? 'لا توجد تعليقات بعد في هذا الدرس. كن أول من يبدأ النقاش!'
                : 'No comments yet for this lesson. Be the first to start the discussion!'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {rootComments.map(comment => {
                const replies = repliesByParent[comment.id] || [];
                return (
                  <div
                    key={comment.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid rgba(11, 40, 73, 0.08)',
                      borderRadius: '14px',
                      padding: '16px'
                    }}
                  >
                    {/* Comment Body */}
                    <CommentCard
                      comment={comment}
                      lang={lang}
                      currentUserId={userId}
                      isRtl={isRtl}
                      formatDate={formatCommentDate}
                      onToggleHeart={handleToggleHeart}
                      onStartReply={id => {
                        setReplyingToId(id);
                        setReplyText('');
                      }}
                      onStartEdit={c => {
                        setEditingId(c.id);
                        setEditText(c.content);
                      }}
                      onDelete={handleDeleteComment}
                      isEditing={editingId === comment.id}
                      editText={editText}
                      setEditText={setEditText}
                      onSaveEdit={() => handleSaveEdit(comment.id)}
                      onCancelEdit={() => setEditingId(null)}
                    />

                    {/* Replies Container (YouTube-style clean indented list) */}
                    {replies.length > 0 && (
                      <div
                        style={{
                          marginTop: '16px',
                          paddingTop: '14px',
                          marginRight: isRtl ? '24px' : '0',
                          marginLeft: isRtl ? '0' : '24px',
                          borderRight: isRtl ? '1px solid rgba(11, 40, 73, 0.12)' : 'none',
                          borderLeft: isRtl ? 'none' : '1px solid rgba(11, 40, 73, 0.12)',
                          paddingRight: isRtl ? '16px' : '0',
                          paddingLeft: isRtl ? '0' : '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '14px'
                        }}
                      >
                        {replies.map(reply => (
                          <CommentCard
                            key={reply.id}
                            comment={reply}
                            lang={lang}
                            currentUserId={userId}
                            isRtl={isRtl}
                            formatDate={formatCommentDate}
                            onToggleHeart={handleToggleHeart}
                            onStartReply={() => {
                              setReplyingToId(comment.id);
                              setReplyText('');
                            }}
                            onStartEdit={c => {
                              setEditingId(c.id);
                              setEditText(c.content);
                            }}
                            onDelete={handleDeleteComment}
                            isEditing={editingId === reply.id}
                            editText={editText}
                            setEditText={setEditText}
                            onSaveEdit={() => handleSaveEdit(reply.id)}
                            onCancelEdit={() => setEditingId(null)}
                            isReply={true}
                          />
                        ))}
                      </div>
                    )}

                    {/* Reply Input Box */}
                    {replyingToId === comment.id && (
                      <div
                        style={{
                          marginTop: '14px',
                          marginRight: isRtl ? '24px' : '0',
                          marginLeft: isRtl ? '0' : '24px',
                          background: 'rgba(11, 40, 73, 0.02)',
                          border: '1px solid rgba(11, 40, 73, 0.08)',
                          borderRadius: '10px',
                          padding: '12px'
                        }}
                      >
                        <textarea
                          value={replyText}
                          onInput={e => setReplyText(e.target.value)}
                          placeholder={isRtl ? 'اكتب ردك هنا...' : 'Write your reply here...'}
                          rows={2}
                          style={{
                            width: '100%',
                            background: '#ffffff',
                            border: '1px solid rgba(11, 40, 73, 0.12)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '13px',
                            color: '#0b2849',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit',
                            boxSizing: 'border-box'
                          }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '8px',
                            marginTop: '8px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToId(null);
                              setReplyText('');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(11, 40, 73, 0.6)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '6px 12px'
                            }}
                          >
                            {isRtl ? 'إلغاء' : 'Cancel'}
                          </button>
                          <button
                            type="button"
                            disabled={submitting || !replyText.trim()}
                            onClick={() => handleSubmitReply(comment.id)}
                            style={{
                              background: 'linear-gradient(90deg, #0b2849 0%, #004c6d 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px 16px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              cursor: submitting || !replyText.trim() ? 'not-allowed' : 'pointer',
                              opacity: submitting || !replyText.trim() ? 0.6 : 1,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{isRtl ? 'إرسال الرد' : 'Reply'}</span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }}
                            >
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Subcomponent: Comment Card
function CommentCard({
  comment,
  lang,
  currentUserId,
  isRtl,
  formatDate,
  onToggleHeart,
  onStartReply,
  onStartEdit,
  onDelete,
  isEditing,
  editText,
  setEditText,
  onSaveEdit,
  onCancelEdit,
  isReply = false
}) {
  const isOwner = currentUserId && comment.user_id === currentUserId;
  const authorName =
    comment.profile?.full_name || (isRtl ? 'طالب مسجل' : 'Enrolled Student');
  const role = comment.profile?.role;
  const isInstructor = role === 'admin' || role === 'superadmin' || role === 'instructor';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Top author row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Avatar (Uploaded avatar_url > Google auth pfp > Initial fallback) */}
          {comment.profile?.avatar_url ? (
            <img
              src={comment.profile.avatar_url}
              alt={authorName}
              style={{
                width: isReply ? '28px' : '34px',
                height: isReply ? '28px' : '34px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid rgba(11, 40, 73, 0.1)',
                flexShrink: 0
              }}
              onError={e => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div
            style={{
              width: isReply ? '28px' : '34px',
              height: isReply ? '28px' : '34px',
              borderRadius: '50%',
              background: isInstructor ? '#15b47a' : 'rgba(11, 40, 73, 0.08)',
              color: isInstructor ? '#ffffff' : '#0b2849',
              display: comment.profile?.avatar_url ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: isReply ? '12px' : '14px',
              flexShrink: 0
            }}
          >
            {authorName.charAt(0).toUpperCase()}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: isReply ? '12.5px' : '13.5px',
                  fontWeight: 'bold',
                  color: '#0b2849'
                }}
              >
                {authorName}
              </span>

              {isInstructor && (
                <span
                  style={{
                    background: 'rgba(21, 180, 122, 0.1)',
                    color: '#15b47a',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '1px 6px',
                    borderRadius: '4px'
                  }}
                >
                  {isRtl ? 'محاضر / مدرب' : 'Instructor'}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '11px',
                color: 'rgba(11, 40, 73, 0.5)',
                display: 'block'
              }}
            >
              {formatDate(comment.created_at)}
            </span>
          </div>
        </div>

        {/* Owner actions (Edit / Delete) */}
        {isOwner && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => onStartEdit(comment)}
              title={isRtl ? 'تعديل' : 'Edit'}
              style={{
                background: 'rgba(11, 40, 73, 0.05)',
                border: 'none',
                cursor: 'pointer',
                color: '#0b2849',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.1)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.05)')}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(comment.id)}
              title={isRtl ? 'حذف' : 'Delete'}
              style={{
                background: 'rgba(230, 57, 70, 0.06)',
                border: 'none',
                cursor: 'pointer',
                color: '#e63946',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(230, 57, 70, 0.15)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(230, 57, 70, 0.06)')}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Comment text or editing box */}
      {isEditing ? (
        <div style={{ marginTop: '4px' }}>
          <textarea
            value={editText}
            onInput={e => setEditText(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              background: '#ffffff',
              border: '1px solid rgba(11, 40, 73, 0.2)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#0b2849',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '6px',
              marginTop: '6px'
            }}
          >
            <button
              onClick={onCancelEdit}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(11, 40, 73, 0.6)',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={onSaveEdit}
              style={{
                background: '#0b2849',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isRtl ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: '4px 0 0 0',
            fontSize: isReply ? '13px' : '14px',
            color: 'rgba(11, 40, 73, 0.85)',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap'
          }}
        >
          {comment.content}
        </p>
      )}

      {/* Action Footer (Heart & Reply) */}
      {!isEditing && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '4px'
          }}
        >
          {/* Heart Button */}
          <button
            onClick={() => onToggleHeart(comment.id, comment.isHearted)}
            style={{
              background: comment.isHearted ? 'rgba(230, 57, 70, 0.1)' : 'rgba(11, 40, 73, 0.05)',
              border: 'none',
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: comment.isHearted ? '#e63946' : '#0b2849',
              fontSize: '12px',
              fontWeight: comment.isHearted ? 'bold' : 'normal',
              transition: 'background 0.2s ease, transform 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = comment.isHearted ? 'rgba(230, 57, 70, 0.18)' : 'rgba(11, 40, 73, 0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = comment.isHearted ? 'rgba(230, 57, 70, 0.1)' : 'rgba(11, 40, 73, 0.05)')}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill={comment.isHearted ? '#e63946' : 'none'}
              stroke={comment.isHearted ? '#e63946' : 'currentColor'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
              {comment.heartCount > 0 ? comment.heartCount : ''}
            </span>
          </button>

          {/* Reply Button */}
          <button
            onClick={() => onStartReply(comment.id)}
            style={{
              background: 'rgba(11, 40, 73, 0.05)',
              border: 'none',
              cursor: 'pointer',
              padding: '5px 12px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#0b2849',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.1)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(11, 40, 73, 0.05)')}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: isRtl ? 'scaleX(-1)' : 'none' }}
            >
              <polyline points="9 17 4 12 9 7" />
              <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
            </svg>
            <span>{isRtl ? 'رد' : 'Reply'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
