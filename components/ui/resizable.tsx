'use client'

import {
  Panel,
  PanelProps,
} from 'react-resizable-panels'



function ResizablePanel({ ...props }: PanelProps) {
  return <Panel {...props} />
}


export { ResizablePanel,  }
