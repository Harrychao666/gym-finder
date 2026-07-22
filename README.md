# 练哪儿｜广州健身房选馆助手

这是一个用于用户访谈的可点击产品原型，帮助广州健身新手先表达需求，再从 3 家候选场馆中作出判断。

当前流程：

1. 选择常去区域、通勤时间、预算和训练时段。
2. 勾选新手指导、低推销、拥挤度、器械、淋浴或 24 小时等条件。
3. 获得 3 家场馆建议，查看推荐理由和办卡风险。
4. 打开场馆详情，或选择 2-3 家进行横向对比。

当前场馆名称、价格和评测信息均为访谈演示数据，不构成真实消费建议。卡片使用 Unsplash 健身场景图占位，正式上线前应替换为门店授权照片或自采照片。

本地预览：

```bash
python3 -m http.server 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

## 体验官首轮试跑

项目现在包含一个不依赖第三方包的本地后端，用于首位同学完成 7 天测评。它支持任务口令、自动保存、四次训练记录、价格与器械盘点、证据上传以及最终提交校验。

启动：

```bash
node server.mjs
```

启动成功后，终端会分别输出用户端地址和带访问口令的“首轮体验官入口”。请只把完整的体验官入口发给本次测试同学，不要公开发布。

试跑数据保存在 `runtime-data/store.json`，证据文件保存在 `runtime-data/uploads/`。这两个位置已被 Git 忽略，适合本地试跑；正式部署时应替换成数据库和私有对象存储。

接口测试：

```bash
node --test tests/backend.test.mjs
```

## 报告上传、AI审核与前端发布

启动 `node server.mjs` 后，终端会额外输出两个带随机口令的地址：

- `报告上传入口`：发给体验官，用于上传填写完成的 DOCX/TXT 报告。
- `管理员审核入口`：仅管理员使用，可查看AI总结、修改前端字段并点击“批准并发布”。

未审核的报告不会出现在公开接口。管理员发布后，用户前端通过 `GET /api/venues` 读取已发布数据；管理员也可以下架内容。

自动AI总结使用 OpenAI Responses API。服务器环境变量：

```text
OPENAI_API_KEY=服务器密钥（不要写入前端或提交到 Git）
OPENAI_MODEL=gpt-5.6-luna
ADMIN_TOKEN=可选的固定管理员口令
UPLOAD_TOKEN=可选的固定体验官上传口令
ALLOWED_ORIGINS=https://gym-finder.netlify.app
```

没有设置 `OPENAI_API_KEY` 时，系统仍可完成上传、DOCX文字提取、人工审核和发布，但只生成“本地预览分析”。配置密钥后可在后台点击“重新分析”。

当前本地存储适合试跑。正式部署前应将 `runtime-data/store.json` 和上传目录替换为数据库与私有对象存储，并在 `config.js` 中配置线上后台地址。

## Render 内部试跑部署

仓库根目录的 `render.yaml` 会创建一个新加坡区域的 Node Web Service，并挂载 1 GB 持久化硬盘。该配置使用支持持久化硬盘的付费 `starter` 实例；在 Render 页面最终 Apply 前请确认页面显示的费用。

首次创建时需要在 Render 页面填写三个不会进入 Git 的秘密变量：

- `OPENAI_API_KEY`：OpenAI API 密钥。
- `ADMIN_TOKEN`：管理员审核口令，建议使用密码管理器生成。
- `UPLOAD_TOKEN`：体验官上传口令，不能与管理员口令相同。

部署成功后，把 Render 提供的 HTTPS 地址填入 `config.js` 的 `GYM_API_BASE`，再部署 Netlify 前端。
