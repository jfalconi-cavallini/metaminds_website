// Parent portal — renders the shared student/parent portal component.
// The proxy enforces that only role="parent" reaches this route.
// The StudentPortal component detects user.role==="parent" and filters
// tabs/mutations accordingly (PARENT_TABS, isParent guards).
export { default } from "@/app/portal/student/page";
