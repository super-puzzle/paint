import React from 'react'
import { createRoot } from 'react-dom/client'
import { TestComponent } from './TestComponent'
const root = createRoot(document.getElementById('app')!)
root.render(<TestComponent />)
