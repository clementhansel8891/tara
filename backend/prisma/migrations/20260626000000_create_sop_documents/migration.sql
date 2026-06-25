-- CreateTable
CREATE TABLE "sop_documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL DEFAULT 'application/pdf',
    "uploaded_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sop_documents_category_idx" ON "sop_documents"("category");

-- CreateIndex
CREATE INDEX "sop_documents_is_active_idx" ON "sop_documents"("is_active");

-- CreateIndex
CREATE INDEX "sop_documents_created_at_idx" ON "sop_documents"("created_at");
