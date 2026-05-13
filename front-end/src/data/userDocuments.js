export const documentSections = [
  {
    id: 'uploaded',
    label: 'Tài liệu đã tải lên',
    description: 'Theo dõi các file bạn đã gửi lên hệ thống.',
    count: 4,
  },
  {
    id: 'downloaded',
    label: 'Tài liệu đã tải xuống',
    description: 'Danh sách tài liệu bạn đã mở hoặc tải về.',
    count: 3,
  },
  {
    id: 'reviewed',
    label: 'Tài liệu đã đánh giá',
    description: 'Các tài liệu bạn đã nhận xét hoặc chấm điểm.',
    count: 2,
  },
]

export const uploadedDocuments = [
  {
    id: 'upl-1',
    title: 'Giáo trình Cấu trúc dữ liệu',
    subject: 'Môn CTDL & GT',
    uploadedAt: '18/04/2026',
    size: '3.2 MB',
    status: 'approved',
    statusLabel: 'Đã duyệt',
  },
  {
    id: 'upl-2',
    title: 'Báo cáo thực tập doanh nghiệp',
    subject: 'Kinh tế số',
    uploadedAt: '19/04/2026',
    size: '1.1 MB',
    status: 'pending',
    statusLabel: 'Đang chờ duyệt',
  },
  {
    id: 'upl-3',
    title: 'Đề cương môn Toán rời rạc',
    subject: 'Toán ứng dụng',
    uploadedAt: '20/04/2026',
    size: '5.8 MB',
    status: 'rejected',
    statusLabel: 'Bị từ chối',
    rejectReason:
      'Tài liệu trùng lặp với bản đã có trên hệ thống và chưa bổ sung mô tả nội dung.',
  },
  {
    id: 'upl-4',
    title: 'Slide nhập môn AI',
    subject: 'Trí tuệ nhân tạo',
    uploadedAt: '21/04/2026',
    size: '8.4 MB',
    status: 'approved',
    statusLabel: 'Đã duyệt',
  },
]

export const downloadedDocuments = [
  {
    id: 'down-1',
    title: 'Tổng hợp câu hỏi phỏng vấn Java',
    subject: 'Kỹ thuật phần mềm',
    downloadedAt: '21/04/2026',
    size: '2.4 MB',
  },
  {
    id: 'down-2',
    title: 'Tài liệu ôn tập xác suất thống kê',
    subject: 'Toán cao cấp',
    downloadedAt: '20/04/2026',
    size: '4.1 MB',
  },
  {
    id: 'down-3',
    title: 'Mẫu báo cáo đồ án tốt nghiệp',
    subject: 'Khai thác dữ liệu',
    downloadedAt: '19/04/2026',
    size: '1.9 MB',
  },
]

export const reviewedDocuments = [
  {
    id: 'rev-1',
    title: 'Hệ điều hành - Tóm tắt chương 1',
    subject: 'Hệ điều hành',
    reviewedAt: '18/04/2026',
    rating: 5,
    note: 'Trình bày dễ hiểu, có ví dụ rõ ràng.',
  },
  {
    id: 'rev-2',
    title: 'Bài giảng CSDL nâng cao',
    subject: 'Cơ sở dữ liệu',
    reviewedAt: '17/04/2026',
    rating: 4,
    note: 'Nội dung tốt, phần demo nên chi tiết hơn.',
  },
]
