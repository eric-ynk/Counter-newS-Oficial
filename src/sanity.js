import { createClient } from '@sanity/client'

export default createClient({
  projectId: 'afvh57o7',
  dataset: 'dataset', 
  useCdn: false,
  apiVersion: '2023-01-01',
})