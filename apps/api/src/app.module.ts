import { Module } from "@nestjs/common";
import { AuthModule } from "./modules/auth/auth.module.js";
import { FilesModule } from "./modules/files/files.module.js";
import { ReviewsModule } from "./modules/reviews/reviews.module.js";
import { SubmissionsModule } from "./modules/submissions/submissions.module.js";
import { TrackingModule } from "./modules/tracking/tracking.module.js";
import { FileStorageModule } from "./infrastructure/file-storage.module.js";
import { WorkflowStoreModule } from "./infrastructure/workflow-store.module.js";

@Module({
  imports: [
    WorkflowStoreModule,
    FileStorageModule,
    AuthModule,
    SubmissionsModule,
    ReviewsModule,
    TrackingModule,
    FilesModule,
  ],
})
export class AppModule {}
