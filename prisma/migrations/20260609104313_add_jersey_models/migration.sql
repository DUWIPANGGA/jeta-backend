-- CreateTable
CREATE TABLE "jersey_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jersey_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_combinations" (
    "id" SERIAL NOT NULL,
    "jersey_template_id" INTEGER NOT NULL,
    "color_option_id" INTEGER NOT NULL,
    "size_option_id" INTEGER NOT NULL,
    "material_option_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_combinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tim_jerseys" (
    "id" SERIAL NOT NULL,
    "custom_order_id" INTEGER NOT NULL,
    "team_name" TEXT,
    "logo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tim_jerseys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pemains" (
    "id" SERIAL NOT NULL,
    "tim_jersey_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nomor_punggung" INTEGER NOT NULL,
    "ukuran_option_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pemains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_combinations_jersey_template_id_color_option_id_si_key" ON "template_combinations"("jersey_template_id", "color_option_id", "size_option_id", "material_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "tim_jerseys_custom_order_id_key" ON "tim_jerseys"("custom_order_id");

-- AddForeignKey
ALTER TABLE "template_combinations" ADD CONSTRAINT "template_combinations_jersey_template_id_fkey" FOREIGN KEY ("jersey_template_id") REFERENCES "jersey_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_combinations" ADD CONSTRAINT "template_combinations_color_option_id_fkey" FOREIGN KEY ("color_option_id") REFERENCES "variant_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_combinations" ADD CONSTRAINT "template_combinations_size_option_id_fkey" FOREIGN KEY ("size_option_id") REFERENCES "variant_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_combinations" ADD CONSTRAINT "template_combinations_material_option_id_fkey" FOREIGN KEY ("material_option_id") REFERENCES "variant_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tim_jerseys" ADD CONSTRAINT "tim_jerseys_custom_order_id_fkey" FOREIGN KEY ("custom_order_id") REFERENCES "custom_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemains" ADD CONSTRAINT "pemains_tim_jersey_id_fkey" FOREIGN KEY ("tim_jersey_id") REFERENCES "tim_jerseys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pemains" ADD CONSTRAINT "pemains_ukuran_option_id_fkey" FOREIGN KEY ("ukuran_option_id") REFERENCES "variant_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
