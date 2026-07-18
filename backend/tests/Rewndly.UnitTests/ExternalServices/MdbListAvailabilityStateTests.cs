using Rewndly.Infrastructure.ExternalServices.MdbList;

namespace Rewndly.UnitTests.ExternalServices;

public sealed class MdbListAvailabilityStateTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 17, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void IsAvailable_ReturnsTrue_ByDefault()
    {
        var state = new MdbListAvailabilityState();

        Assert.True(state.IsAvailable(Now));
    }

    [Fact]
    public void ReportOutage_DisablesUntilCooldownExpires()
    {
        var state = new MdbListAvailabilityState();

        state.ReportOutage(MdbListOutageReason.RateLimited, Now, TimeSpan.FromMinutes(15));

        Assert.False(state.IsAvailable(Now));
        Assert.False(state.IsAvailable(Now.AddMinutes(14)));
        Assert.True(state.IsAvailable(Now.AddMinutes(15)));
    }

    [Fact]
    public void ReportOutage_EnqueuesSingleTransition_ForRepeatedFailuresWithSameReason()
    {
        var state = new MdbListAvailabilityState();

        state.ReportOutage(MdbListOutageReason.RateLimited, Now, TimeSpan.FromMinutes(15));
        state.ReportOutage(MdbListOutageReason.RateLimited, Now.AddMinutes(1), TimeSpan.FromMinutes(15));

        Assert.True(state.TryDequeueTransition(out var transition));
        Assert.True(transition.Disabled);
        Assert.Equal(MdbListOutageReason.RateLimited, transition.Reason);
        Assert.False(state.TryDequeueTransition(out _));
    }

    [Fact]
    public void ReportOutage_EnqueuesTransition_WhenReasonChanges()
    {
        var state = new MdbListAvailabilityState();

        state.ReportOutage(MdbListOutageReason.RateLimited, Now, TimeSpan.FromMinutes(15));
        state.ReportOutage(MdbListOutageReason.AuthFailure, Now.AddMinutes(1), TimeSpan.FromMinutes(60));

        Assert.True(state.TryDequeueTransition(out var first));
        Assert.Equal(MdbListOutageReason.RateLimited, first.Reason);
        Assert.True(state.TryDequeueTransition(out var second));
        Assert.Equal(MdbListOutageReason.AuthFailure, second.Reason);
    }

    [Fact]
    public void ReportSuccess_AfterOutage_ReenablesAndEnqueuesRecovery()
    {
        var state = new MdbListAvailabilityState();
        state.ReportOutage(MdbListOutageReason.AuthFailure, Now, TimeSpan.FromMinutes(60));

        state.ReportSuccess();

        Assert.True(state.IsAvailable(Now));
        Assert.True(state.TryDequeueTransition(out var disabled));
        Assert.True(disabled.Disabled);
        Assert.True(state.TryDequeueTransition(out var recovered));
        Assert.False(recovered.Disabled);
        Assert.False(state.TryDequeueTransition(out _));
    }

    [Fact]
    public void ReportSuccess_WithoutPriorOutage_DoesNotEnqueueTransition()
    {
        var state = new MdbListAvailabilityState();

        state.ReportSuccess();

        Assert.False(state.TryDequeueTransition(out _));
    }

    [Fact]
    public void Snapshot_ReturnsReasonAndDeadline_WhileDisabled()
    {
        var state = new MdbListAvailabilityState();
        state.ReportOutage(MdbListOutageReason.RateLimited, Now, TimeSpan.FromMinutes(15));

        var (disabledUntil, reason) = state.Snapshot(Now);

        Assert.Equal(Now.AddMinutes(15), disabledUntil);
        Assert.Equal(MdbListOutageReason.RateLimited, reason);
    }

    [Fact]
    public void Snapshot_ReturnsEmpty_AfterCooldownExpires()
    {
        var state = new MdbListAvailabilityState();
        state.ReportOutage(MdbListOutageReason.RateLimited, Now, TimeSpan.FromMinutes(15));

        var (disabledUntil, reason) = state.Snapshot(Now.AddMinutes(16));

        Assert.Null(disabledUntil);
        Assert.Null(reason);
    }
}
