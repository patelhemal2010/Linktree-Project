import React, {useEffect, useState} from 'react'
import api from '../api/client'
import LinkCard from '../components/LinkCard'

export default function Links(){
  const [links, setLinks] = useState([])
  useEffect(()=>{
    api.get('/links')
      .then(res=> setLinks(res.data))
      .catch(()=>{})
  },[])

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Links</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {links.length === 0 && <div className="text-gray-500">No links found.</div>}
        {links.map(l=> <LinkCard key={l._id || l.id} link={l} />)}
      </div>
    </div>
  )
}
