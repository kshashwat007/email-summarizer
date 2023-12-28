import React from 'react'

const SummaryData = ({ params }: { params: { id: string } }) => {
  return (
    <div>page {params.id}</div>
  )
}

export default SummaryData