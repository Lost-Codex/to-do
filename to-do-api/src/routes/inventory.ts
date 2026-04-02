import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";

export const inventoryRoutes = (app: Elysia) =>
  app.group('/inventory', (app) =>
    app
      // Lab 1: GET /inventory - ดึงข้อมูลสินค้าทั้งหมด เรียงตามชื่อ A-Z
      // Challenge: เพิ่ม query param low_stock=true สำหรับสินค้าที่ quantity <= 10
      .get('/', async ({ query }) => {
        const lowStock = query.low_stock === 'true';
        const where = lowStock ? { quantity: { lte: 10 } } : {};

        return await prisma.product.findMany({
          where,
          orderBy: { name: 'asc' },
        });
      })

      // Lab 2: POST /inventory - เพิ่มสินค้าใหม่
      // Challenge: ใช้ TypeBox สำหรับ validation
      .post(
        '/',
        async ({ body }) => {
          return await prisma.product.create({
            data: {
              name: body.name,
              sku: body.sku,
              quantity: body.quantity ?? 0,
              zone: body.zone,
            },
          });
        },
        {
          body: t.Object({
            name: t.String({ minLength: 1 }),
            sku: t.String({ minLength: 1 }),
            quantity: t.Optional(t.Number()),
            zone: t.String({ minLength: 1 }),
          }),
        }
      )

      // Lab 3: PATCH /inventory/:id/adjust - อัปเดตจำนวนสต็อก
      // Challenge: รับ { change: number } แล้วบวกลบกับค่าเดิม
      .patch('/:id/adjust', async ({ params: { id }, body, set }) => {
        const product = await prisma.product.findUnique({ where: { id } });

        if (!product) {
          set.status = 404;
          return { error: 'Product ไม่พบ' };
        }

        const newQuantity = product.quantity + body.change;

        if (newQuantity < 0) {
          set.status = 400;
          return { error: 'จำนวนสินค้าไม่สามารถติดลบได้' };
        }

        return await prisma.product.update({
          where: { id },
          data: { quantity: newQuantity },
        });
      }, {
        body: t.Object({
          change: t.Number(),
        }),
      })

      // Lab 4: DELETE /inventory/:id - ลบสินค้า
      // Challenge: ตรวจสอบ quantity == 0 ก่อนลบ
      .delete('/:id', async ({ params: { id }, set }) => {
        const product = await prisma.product.findUnique({ where: { id } });

        if (!product) {
          set.status = 404;
          return { error: 'Product ไม่พบ' };
        }

        if (product.quantity > 0) {
          set.status = 400;
          return { error: 'ไม่สามารถลบสินค้าที่ยังมีอยู่ในสต็อกได้' };
        }

        await prisma.product.delete({ where: { id } });
        return { message: 'ลบสินค้าเรียบร้อยแล้ว' };
      })
  );