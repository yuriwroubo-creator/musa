import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useVendorStats() {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['vendor-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // 1. Get vendor subscription
      const { data: vendorSub, error: vendorError } = await supabase
        .from('vendor_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (vendorError || !vendorSub) {
        return {
          vendorId: null,
          totalListings: 0,
          totalFavorites: 0,
          totalFollowers: 0,
          totalViews: 0,
        };
      }

      const vendorId = vendorSub.id;

      // 2. Count total products
      const { data: products, count: productsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('vendor_id', vendorId);

      // 3. Count total services
      const { count: servicesCount } = await supabase
        .from('services')
        .select('id', { count: 'exact' })
        .eq('vendor_id', vendorId);

      const totalListings = (productsCount || 0) + (servicesCount || 0);

      // 4. Followers
      const { count: followersCount } = await supabase
        .from('follows')
        .select('id', { count: 'exact' })
        .eq('following_id', vendorId);

      let totalFavorites = 0;
      let totalViews = 0;

      const productIds = products?.map(p => p.id) || [];
      
      if (productIds.length > 0) {
        // 5. Total Favorites
        const { count: favCount } = await supabase
          .from('favorites')
          .select('id', { count: 'exact' })
          .in('product_id', productIds);
        
        totalFavorites = favCount || 0;

        // 6. Total Views
        const { count: viewCount } = await supabase
          .from('product_views')
          .select('id', { count: 'exact' })
          .in('product_id', productIds);
          
        totalViews = viewCount || 0;
      }

      return {
        vendorId,
        totalListings,
        totalFavorites,
        totalFollowers: followersCount || 0,
        totalViews,
      };
    },
    enabled: !!user,
  });

  return {
    vendorId: data?.vendorId || null,
    totalListings: data?.totalListings || 0,
    totalFavorites: data?.totalFavorites || 0,
    totalFollowers: data?.totalFollowers || 0,
    totalViews: data?.totalViews || 0,
    loading,
  };
}
