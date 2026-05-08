-- CreateTable
CREATE TABLE "work_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "stage_id" INTEGER NOT NULL,
    "order_type" TEXT NOT NULL,
    "custom_order_id" INTEGER,
    "sport_order_id" INTEGER,
    "quantity" INTEGER NOT NULL,
    "earned_amount" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_custom_order_id_fkey" FOREIGN KEY ("custom_order_id") REFERENCES "custom_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_sport_order_id_fkey" FOREIGN KEY ("sport_order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
