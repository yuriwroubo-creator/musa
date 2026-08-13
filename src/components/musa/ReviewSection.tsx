import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewSectionProps {
  vendorId: string;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ vendorId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Depending on relationship definitions, profiles could be an array or an object
      // Supabase js client types it based on db schema, assuming object for 1:1 or N:1
      setReviews(data as any || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      fetchReviews();
    }
  }, [vendorId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Inicia sessão para deixar uma avaliação.');
      return;
    }
    if (newRating === 0) {
      toast.error('Por favor, escolhe uma classificação de 1 a 5.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        vendor_id: vendorId,
        user_id: user.id,
        rating: newRating,
        comment: newComment
      });

      if (error) throw error;

      toast.success('Avaliação submetida com sucesso!');
      setNewRating(0);
      setNewComment('');
      fetchReviews();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Erro ao submeter avaliação. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="mt-8 space-y-8">
      <div className="flex items-center gap-4">
        <h3 className="text-xl font-bold">Avaliações</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 bg-secondary/50 px-3 py-1 rounded-full">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="font-semibold">{averageRating}</span>
            <span className="text-sm text-muted-foreground">({reviews.length})</span>
          </div>
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="bg-card border border-border-soft p-4 rounded-xl space-y-4">
          <h4 className="font-medium text-sm">Deixar uma avaliação</h4>
          
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewRating(star)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= newRating
                      ? 'fill-primary text-primary'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="O que achaste do serviço?"
            className="w-full bg-secondary border-none rounded-xl p-3 text-sm min-h-[100px] resize-y focus:ring-1 focus:ring-primary"
          />

          <button
            type="submit"
            disabled={submitting || newRating === 0}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            {submitting ? 'A submeter...' : 'Submeter Avaliação'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>Ainda não há avaliações.</p>
          </div>
        ) : (
          reviews.map((review) => {
            // Depending on Supabase JS and the profile schema, it could be an array or object.
            const profile = Array.isArray(review.profiles) ? review.profiles[0] : review.profiles;
            const authorName = profile?.full_name || 'Utilizador Anónimo';
            const avatarUrl = profile?.avatar_url;

            return (
              <div key={review.id} className="bg-card border border-border-soft p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={authorName} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-medium text-primary">
                        {authorName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= review.rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {review.comment}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
