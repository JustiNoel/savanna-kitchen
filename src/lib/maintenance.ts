// DEPRECATED static flag — kept only as a safety fallback if app_settings can't load.
// Live state now comes from `useAppSettings()` (table: public.app_settings).
// Admins can toggle from Admin → Settings tab.
export const MAINTENANCE_MODE = false;

export const MAINTENANCE_MESSAGE =
  "Our ordering system is currently under maintenance. Updates are ongoing — please check back later. Thank you for your patience! 🛠️";
