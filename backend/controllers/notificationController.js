const Notification = require("../models/Notification");
const { AppError, catchAsync } = require("../middlewares/errorMiddleware");
const { formatResponse } = require("../utils/responseFormatter");

/**
 * @desc Get all notifications for the logged-in user (works for all user types)
 * @route GET /api/user/notifications, /api/coach/notifications, /api/admin/notifications
 * @access Private
 */
exports.getNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id }).sort("-createdAt");

  res.json(formatResponse("success", "Notifications retrieved", { notifications }));
});

/**
 * @desc Mark notifications as read (works for all user types)
 * @route PATCH /api/user/notifications/read, /api/coach/notifications/read, /api/admin/notifications/read
 * @access Private
 */
exports.markNotificationsAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });

  res.json(formatResponse("success", "All notifications marked as read"));
});

/**
 * @desc Internal function to create notifications
 * @param {String} userId - The ID of the user to notify
 * @param {String} type - Type of notification (booking, approval, payment)
 * @param {String} message - Notification message
 */
exports.createNotification = async (userId, type, message) => {
  await Notification.create({ user: userId, type, message });
};

/**
 * @desc Delete a notification
 * @route DELETE /api/user/notifications/:id, /api/coach/notifications/:id, /api/admin/notifications/:id
 * @access Private
 */
exports.deleteNotification = catchAsync(async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;

  // Find the notification
  const notification = await Notification.findById(notificationId);

  // Check if notification exists
  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  // Check if the notification belongs to the current user
  if (notification.user.toString() !== userId) {
    throw new AppError('Not authorized to delete this notification', 403);
  }

  // Delete the notification
  await Notification.findByIdAndDelete(notificationId);

  res.status(200).json(formatResponse("success", 'Notification deleted successfully'));
});



