export const AdminChecker = (context): boolean => {
    if (!context.auth.isAuthenticated) {
        return false;
    }

    if (!context.auth.isAdmin) {
      return false;
    }

    return true;
};