"use client"
import Image from 'next/image'
import styles from './page.module.css'
import { AppContextProvider } from '@/components/context-provider/app-context-provider';
import BasePromptLayout from '@/examples/basic-prompt-layout/prompt-layout';
import PromptWithColumnMapping from '@/examples/prompt-with-column-mapping/prompt-with-column-mapping';
import LivestreamExampleFinal from '@/examples/livestream-example/final-code';
import LivestreamExample from '@/examples/livestream-example/boilerplate';
import AiAppFooter from '@/components/ai-footer/ai-footer';
import ContextExplorerExample from '@/examples/context-explorer/context-explorer-example'
import BoardAssistant from '@/assistants/boardAssistant/board-assistant';

export default function Home() {
  console.log(
      '🚀 ~ file: page.tsx:14 ~ Home ~ Home:',
      process.env.NEXT_PUBLIC_ENV
  );
  console.log(process.env.NEXT_PUBLIC_ENV)
  return (
    <div className={styles.App}>
    <AppContextProvider>
      {/* <ContextExplorerExample /> */}
      {/* <LivestreamExampleFinal /> */}
      <BoardAssistant/>
      {/* <BasePromptLayout /> */}
    </AppContextProvider>
    </div>
  )
}
