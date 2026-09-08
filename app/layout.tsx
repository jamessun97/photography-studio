import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '观照 · 摄影研习室', description: '旅行、风景与人文纪实：每周 40 小时的个人创作训练、作品项目与学习记录。' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {return <html lang="zh-CN"><body>{children}</body></html>;}
