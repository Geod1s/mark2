import { createClient } from '@/lib/supabase/client';

// Define the structure for inventory thresholds
interface InventoryThresholds {
  low_stock_threshold: number;
  overstock_threshold: number;
  user_id?: string; // Optional: if you want to store per user
  business_id?: string; // Optional: if you want to store per business
}

// Function to save inventory thresholds to Supabase
export const saveInventoryThresholds = async (
  thresholds: Omit<InventoryThresholds, 'user_id'>,
  userId?: string
): Promise<{ success: boolean; message: string }> => {
  const supabase = createClient();

  try {
    // If you have a specific table for inventory settings, use that
    // Otherwise, you might store this in a user preferences table
    const { data, error } = await supabase
      .from('inventory_settings') // You'll need to create this table
      .upsert([
        {
          ...thresholds,
          user_id: userId || null,
          updated_at: new Date().toISOString(),
        }
      ], {
        onConflict: 'user_id', // Adjust this based on your unique key
      });

    if (error) {
      console.error('Error saving inventory thresholds:', error);
      return { success: false, message: `Error: ${error.message}` };
    }

    return { success: true, message: 'Thresholds saved successfully!' };
  } catch (error: any) {
    console.error('Unexpected error saving inventory thresholds:', error);
    return { success: false, message: `Unexpected error: ${error.message}` };
  }
};

// Function to load inventory thresholds from Supabase
export const loadInventoryThresholds = async (
  userId?: string
): Promise<InventoryThresholds | null> => {
  const supabase = createClient();

  try {
    let query = supabase
      .from('inventory_settings')
      .select('low_stock_threshold, overstock_threshold, user_id')
      .limit(1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading inventory thresholds:', error);
      return null;
    }

    if (!data || data.length === 0) {
      // Return default values if no settings exist
      return {
        low_stock_threshold: 5,
        overstock_threshold: 100,
        user_id: userId || undefined,
      };
    }

    return {
      low_stock_threshold: data[0].low_stock_threshold,
      overstock_threshold: data[0].overstock_threshold,
      user_id: data[0].user_id,
    };
  } catch (error: any) {
    console.error('Unexpected error loading inventory thresholds:', error);
    return null;
  }
};

// Alternative function if you want to store thresholds in user metadata
export const saveThresholdsToUserMetadata = async (
  thresholds: Omit<InventoryThresholds, 'user_id'>
): Promise<{ success: boolean; message: string }> => {
  const supabase = createClient();

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, message: 'User not authenticated' };
    }

    // Update user metadata with thresholds
    const { error } = await supabase.auth.updateUser({
      data: {
        low_stock_threshold: thresholds.low_stock_threshold,
        overstock_threshold: thresholds.overstock_threshold,
      }
    });

    if (error) {
      console.error('Error updating user metadata:', error);
      return { success: false, message: `Error: ${error.message}` };
    }

    return { success: true, message: 'Thresholds saved successfully!' };
  } catch (error: any) {
    console.error('Unexpected error saving thresholds to user metadata:', error);
    return { success: false, message: `Unexpected error: ${error.message}` };
  }
};

// Alternative function to load thresholds from user metadata
export const loadThresholdsFromUserMetadata = async (): Promise<InventoryThresholds | null> => {
  const supabase = createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return null;
    }

    if (!user) {
      return null;
    }

    // Return thresholds from user metadata
    return {
      low_stock_threshold: user.user_metadata?.low_stock_threshold ?? 5,
      overstock_threshold: user.user_metadata?.overstock_threshold ?? 100,
      user_id: user.id,
    };
  } catch (error: any) {
    console.error('Unexpected error loading thresholds from user metadata:', error);
    return null;
  }
};