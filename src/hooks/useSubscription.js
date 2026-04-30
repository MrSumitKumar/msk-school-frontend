import { useQuery } from '@tanstack/react-query';
import { schoolsApi } from '../services/api';

export const useSubscription = () => {
    const { data: subData, isLoading } = useQuery({
        queryKey: ['current-subscription'],
        queryFn: () => schoolsApi.billing.currentPlan(),
    });

    const activeSub = subData?.active_plan;
    const planName = activeSub?.plan_name?.toLowerCase() || 'none';

    // Use actual unlocked_modules from the API response
    // plan_details comes from SubscriptionSerializer -> SubscriptionPlanSerializer
    let unlockedModules = [];
    if (activeSub?.plan_details?.unlocked_modules) {
        unlockedModules = activeSub.plan_details.unlocked_modules;
    } else if (activeSub?.unlocked_modules) {
        unlockedModules = activeSub.unlocked_modules;
    }

    // Ensure it's always an array
    if (!Array.isArray(unlockedModules)) {
        unlockedModules = [];
    }

    const isModuleUnlocked = (moduleName) => {
        // Fallback logic for default modules if not explicitly listed or no subscription
        const defaultModules = ['dashboard', 'profile', 'billing'];
        if (defaultModules.includes(moduleName)) return true;

        if (!activeSub) return false;

        // Primary check: use actual unlocked_modules from the database
        if (unlockedModules.includes(moduleName)) {
            return true;
        }

        // Fallback: for plans that might not have unlocked_modules populated yet,
        // or for backward compatibility with old data
        const basicModules = ['students', 'teachers', 'attendance', 'academics'];
        if (planName === 'basic' || planName === 'pro' || planName === 'premium') {
            if (basicModules.includes(moduleName)) return true;
        }

        if (planName === 'pro' || planName === 'premium') {
            if (['fees', 'exams'].includes(moduleName)) return true;
        }

        if (planName === 'premium') {
            return true; // Premium has everything including mobile_app
        }

        return false;
    };

    return {
        activeSub,
        isLoading,
        isModuleUnlocked,
        planName,
        unlockedModules
    };
};
