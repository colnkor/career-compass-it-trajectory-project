import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import authFetch from '../../utils/api'

interface Profession {
  id: number
  name: string
  tags: string
  description: string
  hh_query: string
  median_salary: number | null
  vacancies_count: number | null
  top_skills: string | null
}

export const Route = createFileRoute('/adm/professions')({
  component: RouteComponent,
})

const BLANK_PROFESSION: Profession = {
  id: 0,
  name: '',
  tags: '',
  description: '',
  hh_query: '',
  median_salary: null,
  vacancies_count: null,
  top_skills: null,
}

function RouteComponent() {
  const [professions, setProfessions] = useState<Profession[]>([])
  const [formData, setFormData] = useState<Profession>({ ...BLANK_PROFESSION })
  const [loading, setLoading] = useState(false)

  // READ
  useEffect(() => {
    const fetchProfessions = async () => {
      setLoading(true)
      try {
        const response = await authFetch('/api/admin/professions/')
        if (!response.ok) throw new Error('Не удалось загрузить профессии')
        const data: Profession[] = await response.json()
        setProfessions(data)
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfessions()
  }, [])

  // CREATE / UPDATE
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) { alert('Заполните название профессии'); return }
    if (!formData.tags.trim()) { alert('Заполните теги'); return }
    if (!formData.description.trim()) { alert('Заполните описание'); return }

    setLoading(true)
    try {
      if (formData.id) {
        const response = await authFetch(`/api/admin/professions/${formData.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error('Ошибка при обновлении')
        const updated: Profession = await response.json()
        setProfessions(prev => prev.map(p => p.id === updated.id ? updated : p))
      } else {
        const response = await authFetch('/api/admin/professions/', {
          method: 'POST',
          body: JSON.stringify(formData),
        })
        if (!response.ok) throw new Error('Ошибка при создании')
        const created: Profession = await response.json()
        setProfessions(prev => [...prev, created])
      }
      setFormData({ ...BLANK_PROFESSION })
    } catch (error) {
      alert('Ошибка при сохранении')
    } finally {
      setLoading(false)
    }
  }

  // DELETE
  const handleDelete = async (id: number) => {
    if (!confirm('Удалить профессию?')) return
    setLoading(true)
    try {
      const response = await authFetch(`/api/admin/professions/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Ошибка при удалении')
      setProfessions(prev => prev.filter(p => p.id !== id))
    } catch (error) {
      alert('Ошибка при удалении')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof Profession) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setFormData(prev => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Управление профессиями</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* СПИСОК */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Профессии ({professions.length})
          </h2>

          {loading && <div className="text-gray-500">Загрузка данных...</div>}

          {professions.length === 0 && !loading && (
            <div className="p-4 border border-dashed rounded text-gray-400 text-center">
              Профессий пока нет. Создайте первую!
            </div>
          )}

          {professions.map(p => (
            <div
              key={p.id}
              className={`p-5 border rounded-lg shadow-sm bg-white transition-all ${
                formData.id === p.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-wrap gap-2">
                  {p.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                    <span key={tag} className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="space-x-2 shrink-0 ml-4">
                  <button
                    onClick={() => setFormData({ ...p })}
                    className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded transition"
                  >
                    Редактировать
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                  >
                    Удалить
                  </button>
                </div>
              </div>

              <p className="text-lg font-bold text-gray-900">{p.name}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>

              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                {p.median_salary != null && (
                  <span>💰 Медиана: <b>{p.median_salary.toLocaleString()} ₽</b></span>
                )}
                {p.vacancies_count != null && (
                  <span>📋 Вакансий: <b>{p.vacancies_count.toLocaleString()}</b></span>
                )}
                {p.hh_query && (
                  <span>🔍 HH: <b>{p.hh_query}</b></span>
                )}
              </div>

              {p.top_skills && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {p.top_skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                    <span key={skill} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ФОРМА */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-md h-fit sticky top-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {formData.id ? 'Редактировать' : 'Новая профессия'}
            </h2>
            {formData.id && (
              <button
                type="button"
                onClick={() => setFormData({ ...BLANK_PROFESSION })}
                className="text-xs text-blue-600 hover:underline"
              >
                Сбросить / Новая
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
              <input
                type="text"
                value={formData.name}
                onChange={field('name')}
                placeholder="Frontend-разработчик"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Теги <span className="text-gray-400 font-normal">(через запятую)</span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={field('tags')}
                placeholder="frontend, react, javascript"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={field('description')}
                placeholder="Краткое описание профессии..."
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Запрос для HH.ru</label>
              <input
                type="text"
                value={formData.hh_query}
                onChange={field('hh_query')}
                placeholder="frontend developer"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Медиана зп (₽)</label>
                <input
                  type="number"
                  value={formData.median_salary ?? ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    median_salary: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  placeholder="150000"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Кол-во вакансий</label>
                <input
                  type="number"
                  value={formData.vacancies_count ?? ''}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    vacancies_count: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  placeholder="1200"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Топ навыков <span className="text-gray-400 font-normal">(через запятую)</span>
              </label>
              <input
                type="text"
                value={formData.top_skills ?? ''}
                onChange={e => setFormData(prev => ({
                  ...prev,
                  top_skills: e.target.value || null
                }))}
                placeholder="React, TypeScript, CSS"
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-semibold py-2 px-4 rounded-md text-white transition bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-50"
            >
              {formData.id ? 'Сохранить изменения' : 'Создать профессию'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}