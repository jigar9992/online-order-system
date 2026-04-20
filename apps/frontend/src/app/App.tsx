import { Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "../features/shared/Shell.js";
import { LoginPage } from "../features/auth/LoginPage.js";
import { UploadPage } from "../features/customer-upload/UploadPage.js";
import { ReviewQueuePage } from "../features/admin-review/ReviewQueuePage.js";
import { ReviewDetailPage } from "../features/admin-review/ReviewDetailPage.js";
import { TrackingPage } from "../features/tracking/TrackingPage.js";

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate replace to="/customer/upload" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/customer/upload" element={<UploadPage />} />
        <Route path="/customer/tracking" element={<TrackingPage />} />
        <Route path="/admin/reviews" element={<ReviewQueuePage />} />
        <Route
          path="/admin/reviews/:submissionId"
          element={<ReviewDetailPage />}
        />
      </Routes>
    </Shell>
  );
}
