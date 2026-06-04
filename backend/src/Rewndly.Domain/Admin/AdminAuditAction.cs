namespace Rewndly.Domain.Admin;

public enum AdminAuditAction
{
    UserDisabled = 1,
    UserEnabled = 2,
    UserSoftDeleted = 3,
    RoleChanged = 4,
    ReviewRemoved = 5,
    SystemSettingUpdated = 6,
    PrivateProfileViewed = 7,
    AdminViewedDashboard = 8,
    AdminViewedUser = 9,
    AuditLogsViewed = 10,
    SystemEventsViewed = 11,
    ActivityEventsViewed = 12,
    ReviewSoftDeleted = 13,
    ListSoftDeleted = 14
}
