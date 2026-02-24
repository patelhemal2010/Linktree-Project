import React from 'react'
import { motion } from 'framer-motion'

export default function LinkCard({link}){
  return (
    <motion.a
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
    >
      <div className="font-medium text-gray-900">{link.title}</div>
      {link.description && <div className="text-sm text-gray-500">{link.description}</div>}
    </motion.a>
  )
}
