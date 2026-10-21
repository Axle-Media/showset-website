import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'SHOWSET | Events & Creative Agency',description:'We bring events, creative design, digital experiences and production into one connected agency.',robots:{index:true,follow:true}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0D2F49'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-GB"><body>{children}</body></html>}
