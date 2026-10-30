export const creatorSkills=[
  {id:'paper',name:['纸艺拼贴 Skill','Paper collage Skill'],code:'MG-VOXSTAGE',repo:'https://github.com/chenshuai527/mg-voxstage-skill',image:'assets/skills/paper-reference.webp',imageLabel:['仓库中的视觉语言参考','Visual-language reference from the repository'],
   summary:['把口播稿拆成分镜，延续统一的纸艺拼贴语言，整理图片、视频提示词、封面和发布文案。','Turn narration into a storyboard, cohesive paper-collage images, motion prompts, covers and publishing copy.'],
   body:['把中文口播的制作步骤整理成一条可复用流程：先拆分镜与提示词，再逐张生成、查看和验收画面，最后根据已完成的图片编写运动提示词。','A reusable workflow for Chinese narration: develop the storyboard and prompts, generate and review images one at a time, then write motion prompts from the approved images.'],
   process:['分镜与构图 → 首图确认 → 逐张生图验收 → 视频提示词 → 两版封面与发文','Storyboard → First-image approval → Image-by-image review → Motion prompts → Two cover formats and copy'],
   deliver:['分镜、生图提示词、静态图片、图生视频提示词、独立的 3:4 与 4:3 封面，以及标题、正文和话题。','Storyboard, image prompts, still images, motion prompts, separately composed 3:4 and 4:3 covers, titles, captions and hashtags.'],
   note:['使用实体厚纸片、半调人物、前后景与投影建立视觉层次。Skill 默认交付图片与提示词，成片视频由后续流程制作。','Physical paper layers, halftone cutouts, depth and shadows shape the visual language. The Skill delivers images and prompts; finished video belongs to a later workflow.']},
  {id:'fruit',name:['水果图文 Skill','Fruit editorial Skill'],code:'xhs-fruit-cards',repo:'https://github.com/chenshuai527/xhs-fruit-cards',cover:'assets/work-covers/fruit-skill-cover.webp',image:'assets/skills/fruit-cover.webp',detailImage:'assets/skills/fruit-nutrition.webp',imageLabel:['仓库成品示例 · 草莓封面','Repository example · Strawberry cover'],
   summary:['把水果选题整理成有来源、视觉统一的五页科普图文，从审核、文案到图片和发布包。','A five-page fruit editorial workflow, from sourced research and review to copy, visuals and a publishing package.'],
   body:['先核验资料与选题可行性，再确定五页内容。视觉延续奶白底、墨绿标题和真实水果摄影，让营养档案、常见误区、吃法与挑洗保存保持清楚的阅读层次。','Validate sources and the topic before outlining five pages. Cream backgrounds, dark-green headings and real fruit photography give nutrition, common misconceptions, everyday use and storage a consistent reading hierarchy.'],
   process:['资料核验与选题审核 → 五页文案 → 视觉提示词 → 封面与内页逐张验收 → 发布包','Source review → Five-page copy → Visual prompts → Cover and page review → Publishing package'],
   deliver:['默认五张 3:4 静态图，以及逐页文案、资料来源、提示词、发布文案和验收记录。','Five 3:4 still images by default, plus page copy, sources, prompts, publishing copy and review notes.'],
   note:['将内容核验、视觉一致性和逐张验收放进同一流程，也支持仅写内容、提示词或对某一页定点修改。','Source validation, visual consistency and image review share one workflow. It also supports copy-only work, prompt writing and targeted edits to a single page.']},
  {id:'herbal',name:['药材图文 Skill','Herbal editorial Skill'],code:'xhs-herbal-cards',repo:'https://github.com/chenshuai527/xhs-herbal-cards',cover:'assets/work-covers/herbal-skill-cover.webp',image:'assets/skills/herbal-cover.webp',detailImage:'assets/skills/herbal-evidence.webp',imageLabel:['仓库成品示例 · 黄芪封面','Repository example · Astragalus cover'],
   summary:['围绕药材、食药物质与日常食材，整理有资料依据、表达边界和统一视觉的七页图文。','A seven-page editorial workflow for herbal and everyday ingredients, with sourced research, clear evidence boundaries and a consistent visual system.'],
   body:['支持“草木初识”的单主题和“草木搭配”的双食材主题。先审核内容方向，再分清传统经验、研究证据、适用范围与风险信息，最后进入图文制作。','Supports single-ingredient introductions and paired-ingredient topics. Review the brief, distinguish traditional use from research evidence, define scope and risk information, then produce the illustrated pages.'],
   process:['选题与资料 → 可行性审核 → 七页内容 → 逐页提示词 → 生图验收与交付','Topic and sources → Feasibility review → Seven-page copy → Page prompts → Image review and delivery'],
   deliver:['默认七张 3:4 静态图，配套审核单、资料来源、逐页文案、提示词、发布文案和验收记录。','Seven 3:4 still images by default, with a review sheet, sources, page copy, prompts, publishing copy and review notes.'],
   note:['暖白、墨绿与浅绿知识卡保持系列感；技术规格检查和实际目视检查分别进行。','Warm white, dark green and pale-green information blocks keep the series coherent. Technical file checks and visual review remain separate steps.']}
];

export const xReader={
 name:['英汉同步阅读','English–Chinese Reader'],version:'0.7.5',repo:'https://github.com/chenshuai527/x-bilingual-reader',cover:'assets/work-covers/x-reader-cover.webp',
 images:[
  {src:'assets/x-reader/translation.webp',title:['动态双语阅读','Bilingual posts']},
  {src:'assets/x-reader/video-captions.webp',title:['视频双语字幕','Bilingual video captions']},
  {src:'assets/x-reader/favorites.webp',title:['划词收藏','Saved phrases']},
  {src:'assets/x-reader/docx-export.webp',title:['Word 导出','Word export']}
 ]
};
export const posterCollectionCover='assets/work-covers/ai-posters-cover.webp';
