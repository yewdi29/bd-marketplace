'use client'

import { useCallback, useEffect, useState } from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import AdminButton from '@/components/rigburrito/AdminButton'
import ManageMenu from '@/components/rigburrito/ManageMenu'
import TableSkeleton from '@/components/rigburrito/TableSkeleton'
import ErrorState from '@/components/rigburrito/ErrorState'
import HoldToConfirmButton from '@/components/rigburrito/HoldToConfirmButton'

interface Industry {
  id: string
  name: string
  slug: string
  category_count: number
}

interface Category {
  id: string
  name: string
  slug: string
  industry_id: string | null
  industry_name: string | null
}

export default function TaxonomyPage() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<'industry' | 'category'>('industry')
  const [newName, setNewName] = useState('')
  const [newIndustryId, setNewIndustryId] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null)

  const fetchData = useCallback(async (tab = 'industries') => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ tab })
      if (industryFilter) params.set('industry_id', industryFilter)
      const res = await fetch(`/api/rigburrito/taxonomy?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (tab === 'industries') setIndustries(data.industries)
      else setCategories(data.categories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [industryFilter])

  useEffect(() => { fetchData('industries'); fetchData('categories') }, [fetchData])

  async function handleCreate() {
    if (!newName.trim()) return
    await fetch('/api/rigburrito/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: dialogType,
        name: newName,
        industry_id: dialogType === 'category' ? newIndustryId : undefined,
      }),
    })
    setDialogOpen(false)
    setNewName('')
    fetchData('industries')
    fetchData('categories')
  }

  async function handleEdit(type: 'industry' | 'category', id: string) {
    await fetch('/api/rigburrito/taxonomy', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, name: editName }),
    })
    setEditingId(null)
    fetchData('industries')
    fetchData('categories')
  }

  async function handleDelete(type: 'industry' | 'category', id: string) {
    const res = await fetch('/api/rigburrito/taxonomy', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id }),
    })
    const data = await res.json()
    if (!res.ok) alert(data.error)
    fetchData('industries')
    fetchData('categories')
  }

  return (
    <div>
      <h1 className="rigburrito-page-title">Taxonomy Management</h1>

      <Tabs.Root defaultValue="industries" onValueChange={v => fetchData(v)}>
        <Tabs.List className="mb-6 flex gap-2">
          <Tabs.Trigger value="industries" className="rigburrito-tab">Industries</Tabs.Trigger>
          <Tabs.Trigger value="categories" className="rigburrito-tab">Categories</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="industries">
          <div className="mb-4">
            <AdminButton variant="accent" onClick={() => { setDialogType('industry'); setDialogOpen(true) }}>Add Industry</AdminButton>
          </div>
          {loading ? <TableSkeleton cols={3} /> : error ? <ErrorState message={error} onRetry={() => fetchData('industries')} /> : (
            <div className="rigburrito-table-wrap">
              <table className="rigburrito-table">
                <thead><tr><th>Name</th><th>Categories</th><th>Actions</th></tr></thead>
                <tbody>
                  {industries.map(i => (
                    <tr key={i.id}>
                      <td>
                        {editingId === i.id ? (
                          <input value={editName} onChange={e => setEditName(e.target.value)} className="rigburrito-input" />
                        ) : i.name}
                      </td>
                      <td className="rigburrito-mono">{i.category_count}</td>
                      <td>
                        <div className="flex gap-2">
                          {editingId === i.id ? (
                            <AdminButton variant="secondary" onClick={() => handleEdit('industry', i.id)} style={{ color: '#16A34A' }}>Save</AdminButton>
                          ) : (
                            <AdminButton variant="secondary" onClick={() => { setEditingId(i.id); setEditName(i.name) }} style={{ padding: '6px 12px' }}>Edit</AdminButton>
                          )}
                          {i.category_count === 0 && <HoldToConfirmButton label="Delete" onConfirm={() => handleDelete('industry', i.id)} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>

        <Tabs.Content value="categories">
          <div className="mb-4 flex gap-3">
            <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="rigburrito-select">
              <option value="">All industries</option>
              {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <AdminButton variant="accent" onClick={() => { setDialogType('category'); setDialogOpen(true) }}>Add Category</AdminButton>
          </div>
          <div className="rigburrito-table-wrap">
            <table className="rigburrito-table">
              <thead><tr><th>Name</th><th>Industry</th><th>Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td>
                      {editingId === c.id ? (
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="rigburrito-input" />
                      ) : c.name}
                    </td>
                    <td>{c.industry_name ?? '—'}</td>
                    <td>
                      {deleteCategoryId === c.id ? (
                        <div className="flex items-center gap-2">
                          <HoldToConfirmButton
                            label="Confirm Delete"
                            onConfirm={() => { handleDelete('category', c.id); setDeleteCategoryId(null) }}
                          />
                          <AdminButton variant="secondary" onClick={() => setDeleteCategoryId(null)} style={{ padding: '6px 12px' }}>Cancel</AdminButton>
                        </div>
                      ) : editingId === c.id ? (
                        <AdminButton variant="secondary" onClick={() => handleEdit('category', c.id)} style={{ color: '#16A34A' }}>Save</AdminButton>
                      ) : (
                        <ManageMenu
                          items={[
                            { label: 'Edit', onSelect: () => { setEditingId(c.id); setEditName(c.name) } },
                            { label: 'Delete', onSelect: () => setDeleteCategoryId(c.id), variant: 'danger' },
                          ]}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <Dialog.Content className="rigburrito-card fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 outline-none" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="rigburrito-section-title" style={{ marginBottom: 0 }}>Add {dialogType === 'industry' ? 'Industry' : 'Category'}</Dialog.Title>
              <Dialog.Close asChild><button type="button" className="rigburrito-btn-icon"><X size={16} /></button></Dialog.Close>
            </div>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="rigburrito-input mb-4 w-full" />
            {dialogType === 'category' && (
              <select value={newIndustryId} onChange={e => setNewIndustryId(e.target.value)} className="rigburrito-select mb-4 w-full">
                <option value="">Select industry</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            )}
            <AdminButton variant="accent" onClick={handleCreate} className="w-full">Create</AdminButton>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
