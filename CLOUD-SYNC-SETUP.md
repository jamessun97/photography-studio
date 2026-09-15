# 云端学习档案部署

## 当前状态 · 2026-09-15

代码已完成，本地生产构建、登录页面、数据库隔离/版本冲突/导入测试通过；HTTP测试确认未登录读取返回401、跨站写入403、同源无效登录输入400。

已创建Supabase免费项目 `photography-learning`（`ysxqudweeksmmdflxogt`），执行学习记录迁移SQL并创建个人身份账号。Vercel Production已连接项目并保存账号别名、邮箱及正式网站地址；Supabase Site URL与 `/auth/confirm` 回调已保存。生产发布与真实跨浏览器回读正在验证，未完成前不将本地测试称为生产同步验证。

凭据只取自当前对话，不复制到此文档。旧学习记录迁移从含有真实旧档案的浏览器预览确认，不根据新测试浏览器空状态推断用户没有学习记录。

目标：Vercel网站使用Supabase Auth与Postgres；日常以账号或邮箱登录，记录按用户隔离。旧Sites身份头及Cloudflare数据库不再用于学习档案接口。

## 配置

1. 在Vercel连接专用Supabase项目，选择免费方案。用户确认第三方条款后才能完成安装。
2. 在该项目执行 `supabase/migrations/202609150001_study_sync.sql`。保留RLS。匿名无读写权限，登录用户只能读取自己的记录，写入走带版本检查的数据库函数。
3. 在Supabase Auth管理页创建用户，填用户提供的邮箱与密码，username元数据填用户提供的账号名。不要把密码写进SQL、版本库或Vercel环境变量。不开放公众注册。
4. Vercel Production设置以下**服务端**环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`（或兼容 `SUPABASE_ANON_KEY`）
   - `STUDY_USERNAME`：账号别名
   - `STUDY_EMAIL`：该账号对应邮箱
   - `STUDY_APP_URL`：正式网站URL，不带尾斜杠
5. Supabase Auth配置Site URL为正式地址，允许重定向到正式地址的 `/auth/confirm`。找回密码链接采用PKCE，需在申请邮件的同一浏览器打开。邮箱发送能力与限额应在正式启用时实际验证。
6. 重新部署Vercel。运行时无需service-role/管理员密钥；数据库调用使用当前用户身份。

## 使用与迁移

登录后，保存练习/课次/项目/复习会写入云端，并重新读取核对。登录另一个设备可读取相同档案。未提交输入尝试暂存在账号独立的本机草稿中，不自动认定已同步。

首次登录的浏览器若存在旧localStorage档案，显示导入预览。需用户点击确认合并才上传；原档案不删除。云端已有数据时，保留云端设置；同ID且内容不同的记录保存为导入副本。同一备份再次导入会检查重复副本。导入不自动应用备份中的未提交表单草稿。

两设备冲突后先导出本页草稿，再载入远端比较；可用导入预览保留两份记录。不得自动把空档案或旧版本覆盖到云端。

## 实现边界

- 所有认证发生在路由处理器中，认证Cookie为HttpOnly、SameSite=Lax，生产环境Secure。服务端通过getUser确认身份，不信任旧Sites身份头或浏览器传入用户对象。
- 页面外壳不读取会话，所以不需要在Server Component中刷新Cookie，也没有额外Proxy刷新路径。
- 写入带当前用户ID，服务端与会话比较，防止同一浏览器另一标签页切换账号后，把旧账号内容写入新账号。
- Supabase处理密码与登录限流。前端只在提交登录/修改密码时发送密码，不进入学习备份和日志。
- SQL限制记录大小与主要结构；完整业务格式在保存接口与读取时检查。RLS保证直接访问数据库也无法读取他人档案。
- 原始照片仍留在用户图库，本次只同步文字与照片引用。
- 未配置服务端环境变量时明确保留本机模式；不能将该模式称为云端同步。

## 验证

`npx tsx checks/cloud-sync.mjs`：使用本机Postgres兼容运行时执行真实迁移SQL，检查RLS隔离、匿名拒绝、版本冲突、直接写入拒绝、合并及重复导入。它不代表真实Supabase与Vercel已接通。

`npm run build`：生产构建及TypeScript检查。

正式启用还须验证：用户真实登录、两独立浏览器保存/回读、账号退出、旧记录导入、错误密码、断网、两设备冲突，以及找回邮件。确认完成后再报告账号可用。

官方资料：[Supabase会话](https://supabase.com/docs/guides/auth/server-side/creating-a-client)、[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)、[找回密码](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail)。
