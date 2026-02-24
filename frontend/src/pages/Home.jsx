import React from 'react'
import { motion } from 'framer-motion'

export default function Home(){
  return (
    <div className="text-center py-12">
      <motion.h1 className="text-4xl font-bold mb-4" initial={{opacity:0, y:8}} animate={{opacity:1,y:0}}>Welcome to Linktree</motion.h1>
      <p className="text-gray-600">A minimal frontend for the provided backend. Use the Dashboard to manage links.</p>
    </div>
  )
}
