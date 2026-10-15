# 二手书平台后端

技术栈：Node.js、Express、MySQL、JWT、Multer。默认按腾讯云轻量服务器 + PM2 + Nginx 部署设计。

## 1. 安装依赖

在 `backend` 目录执行：

```powershell
npm install
```

## 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入 MySQL、JWT 和微信配置。没有微信 AppID/Secret 时，开发阶段可以保留 `MOCK_WECHAT_LOGIN=true`，登录 code 使用 `dev-user-1` 这类值。正式环境应设置 `WX_CONTENT_SAFETY_ENABLED=true`，并配置真实微信凭据。

`FEE_RATE` 是平台服务费率，默认 `0.15`，也就是15%。`ADMIN_OPENIDS` 是逗号分隔的微信 openid，只用于 seed 脚本初始化管理员，普通用户没有升级管理员的接口。

## 3. 建表

创建 MySQL 数据库用户后执行：

```powershell
mysql -u root -p < sql/001_init.sql
```

这个命令会创建数据库、用户表、书籍表和订单表。生产环境建议使用数据库迁移工具，不要重复执行会改变数据的脚本。

## 4. 启动

```powershell
npm run check
npm run seed:admin
npm start
```

`npm run check` 检查 JS 语法；`npm run seed:admin` 根据 `ADMIN_OPENIDS` 创建或提升管理员；`npm start` 启动 API 服务。健康检查地址为 `GET /health`。

## 5. 主要接口

- `POST /api/auth/login`：微信登录或开发模拟登录
- `GET /api/books?school=重庆邮电大学&keyword=高数`：书籍列表
- `POST /api/books`：发布书籍，需要 Bearer JWT
- `POST /api/upload`：上传图片，需要 Bearer JWT
- `POST /api/orders`：按 `FEE_RATE` 下单并写入服务费，需要 Bearer JWT
- `GET /api/orders/mine`：查看自己的订单
- `POST /api/orders/:id/complete`：买家确认收货
- `POST /api/orders/:id/refund`：买家在面交前退款
- `POST /api/orders/:id/admin-refund`：管理员同意退款
- `DELETE /api/books/:id`：卖家下架；管理员可下架任意书籍

## 6. 重要上线前工作

当前支付仍是模拟支付。真实上线前必须接入微信支付/分账、真实退款回调、COS 图片存储、频率限制、审计日志、HTTPS 和 Nginx。不能把 `MOCK_WECHAT_LOGIN=true`、`WX_CONTENT_SAFETY_ENABLED=false` 或默认 JWT 密钥带到生产环境。
