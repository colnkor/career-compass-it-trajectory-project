import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import authFetch from '../../utils/api'
import type { RoadmapTopic, RoadmapPhase, Profession } from '../../types/roadmap'

export const Route = createFileRoute('/adm/roadmap')({
  component: RouteComponent,
})

const BLANK_PHASE: RoadmapPhase = {
  id: 0,
  profession_id: 0,
  title: '',
  description: null,
  order: 1,
}

const BLANK_TOPIC: RoadmapTopic = {
  id: 0,
  phase_id: 0,
  title: '',
  description: null,
  resources: null,
  order: 1,
}

function RouteComponent() {
  const [professions, setProfessions] = useState<Profession[]>([])
  const [phases, setPhases] = useState<RoadmapPhase[]>([])
  const [topics, setTopics] = useState<RoadmapTopic[]>([])
  
  const [filterProfessionId, setFilterProfessionId] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  // Состояния для форм
  const [phaseFormData, setPhaseFormData] = useState<RoadmapPhase>({ ...BLANK_PHASE })
  const [topicFormData, setTopicFormData] = useState<RoadmapTopic>({ ...BLANK_TOPIC })

  // 1. Загрузка списка профессий для селектора при монтировании
  useEffect(() => {
    const fetchProfessions = async () => {
      try {
        const res = await authFetch('/api/admin/professions/')
        if (res.ok) {
          const data = await res.json()
          // Поддерживаем как чистый массив, так и структуру вида { professions: [...] }
          setProfessions(data.professions || data || [])
        }
      } catch (err) {
        console.error('Ошибка загрузки профессий:', err)
      }
    }
    fetchProfessions()
  }, [])

  // 2. Загрузка Фаз и Тем при выборе конкретной Профессии
  useEffect(() => {
    if (filterProfessionId === 0) {
      setPhases([])
      setTopics([])
      return
    }

    const fetchRoadmapData = async () => {
      setLoading(true)
      try {
        // Запрос фаз с фильтрацией по profession_id на бэкенде
        const phasesRes = await authFetch(`/api/admin/roadmap/phases?profession_id=${filterProfessionId}`)
        if (phasesRes.ok) {
          const phasesData = await phasesRes.json()
          setPhases(phasesData)
        }

        // Запрос всех тем
        const topicsRes = await authFetch('/api/admin/roadmap/topics')
        if (topicsRes.ok) {
          const topicsData = await topicsRes.json()
          setTopics(topicsData)
        }
      } catch (err) {
        console.error('Ошибка загрузки данных дорожной карты:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRoadmapData()

    // Сбрасываем формы под выбранную профессию
    setPhaseFormData({ ...BLANK_PHASE, profession_id: filterProfessionId })
    setTopicFormData({ ...BLANK_TOPIC })
  }, [filterProfessionId])

  // Фильтрация и сортировка данных на клиенте для вывода
  const currentPhases = [...phases].sort((a, b) => a.order - b.order)
  const currentPhaseIds = currentPhases.map(p => p.id)
  
  const currentTopics = topics
    .filter(t => currentPhaseIds.includes(t.phase_id))
    .sort((a, b) => a.order - b.order)

  // По умолчанию ставим в селектор темы первую доступную фазу текущей профессии
  useEffect(() => {
    if (currentPhases.length > 0 && topicFormData.phase_id === 0) {
      setTopicFormData(prev => ({ ...prev, phase_id: currentPhases[0].id }))
    }
  }, [currentPhases, topicFormData.phase_id])


  // ─── ОБРАБОТЧИКИ ДЛЯ ФАЗ (PHASES) ─────────────────────────────────────────
  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!filterProfessionId) return alert('Сначала выберите профессию!')
    setLoading(true)
    try {
      const bodyData = {
        profession_id: phaseFormData.profession_id,
        title: phaseFormData.title,
        description: phaseFormData.description,
        order: phaseFormData.order,
      }

      if (phaseFormData.id === 0) {
        // Создание фазы
        const res = await authFetch('/api/admin/roadmap/phases', {
          method: 'POST',
          body: JSON.stringify(bodyData),
        })
        if (res.ok) {
          const newPhase = await res.json()
          setPhases(prev => [...prev, newPhase])
          setPhaseFormData({ ...BLANK_PHASE, profession_id: filterProfessionId })
        } else {
          alert('Не удалось создать фазу')
        }
      } else {
        // Обновление фазы
        const res = await authFetch(`/api/admin/roadmap/phases/${phaseFormData.id}`, {
          method: 'PUT',
          body: JSON.stringify(bodyData),
        })
        if (res.ok) {
          const updatedPhase = await res.json()
          setPhases(prev => prev.map(p => (p.id === updatedPhase.id ? updatedPhase : p)))
          setPhaseFormData({ ...BLANK_PHASE, profession_id: filterProfessionId })
        } else {
          alert('Не удалось обновить фазу')
        }
      }
    } catch (err) {
      alert('Ошибка соединения при сохранении фазы')
    } finally {
      setLoading(false)
    }
  }

  const handlePhaseDelete = async (id: number) => {
    if (!confirm('Удалить эту фазу? ВСЕ ТЕМЫ внутри этой фазы также будут удалены каскадно!')) return
    setLoading(true)
    try {
      const res = await authFetch(`/api/admin/roadmap/phases/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPhases(prev => prev.filter(p => p.id !== id))
        setTopics(prev => prev.filter(t => t.phase_id !== id)) // Каскад на фронте
        if (phaseFormData.id === id) setPhaseFormData({ ...BLANK_PHASE, profession_id: filterProfessionId })
      } else {
        alert('Не удалось удалить фазу')
      }
    } catch (err) {
      alert('Ошибка при удалении фазы')
    } finally {
      setLoading(false)
    }
  }


  // ─── ОБРАБОТЧИКИ ДЛЯ ТЕМ (TOPICS) ─────────────────────────────────────────
  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicFormData.phase_id) return alert('Выберите фазу для этой темы!')
    setLoading(true)
    try {
      const bodyData = {
        phase_id: topicFormData.phase_id,
        title: topicFormData.title,
        description: topicFormData.description,
        resources: topicFormData.resources,
        order: topicFormData.order,
      }

      if (topicFormData.id === 0) {
        // Создание темы
        const res = await authFetch('/api/admin/roadmap/topics', {
          method: 'POST',
          body: JSON.stringify(bodyData),
        })
        if (res.ok) {
          const newTopic = await res.json()
          setTopics(prev => [...prev, newTopic])
          setTopicFormData({ ...BLANK_TOPIC, phase_id: currentPhases[0]?.id || 0 })
        } else {
          alert('Не удалось создать тему')
        }
      } else {
        // Обновление темы
        const res = await authFetch(`/api/admin/roadmap/topics/${topicFormData.id}`, {
          method: 'PUT',
          body: JSON.stringify(bodyData),
        })
        if (res.ok) {
          const updatedTopic = await res.json()
          setTopics(prev => prev.map(t => (t.id === updatedTopic.id ? updatedTopic : t)))
          setTopicFormData({ ...BLANK_TOPIC, phase_id: currentPhases[0]?.id || 0 })
        } else {
          alert('Не удалось обновить тему')
        }
      }
    } catch (err) {
      alert('Ошибка соединения при сохранении темы')
    } finally {
      setLoading(false)
    }
  }

  const handleTopicDelete = async (id: number) => {
    if (!confirm('Удалить эту тему?')) return
    setLoading(true)
    try {
      const res = await authFetch(`/api/admin/roadmap/topics/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setTopics(prev => prev.filter(t => t.id !== id))
        if (topicFormData.id === id) setTopicFormData({ ...BLANK_TOPIC, phase_id: currentPhases[0]?.id || 0 })
      } else {
        alert('Не удалось удалить тему')
      }
    } catch (err) {
      alert('Ошибка при удалении темы')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans text-gray-800">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Конструктор дорожных карт (Фазы и Темы)</h1>

      {/* Селектор профессии */}
      <div className="bg-white p-4 rounded-lg shadow mb-8 border border-gray-200">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Шаг 1: Выберите профессию для редактирования</label>
        <select
          value={filterProfessionId}
          onChange={e => setFilterProfessionId(parseInt(e.target.value) || 0)}
          className="w-full md:w-1/3 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 bg-gray-50 font-medium"
        >
          <option value={0}>-- Не выбрана --</option>
          {professions.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {filterProfessionId > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ================= КОЛОНКА 1: ФАЗЫ ================= */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-t-lg border-b-2 border-indigo-200">
              <h2 className="text-xl font-bold text-indigo-900">Уровень 2: Фазы обучения</h2>
            </div>

            {/* Список фаз */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {currentPhases.length === 0 ? (
                <p className="text-gray-500 italic text-sm p-2">У этой профессии пока нет фаз. Создайте первую ниже.</p>
              ) : (
                currentPhases.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-white rounded-md border border-gray-200 hover:shadow-sm transition">
                    <div>
                      <span className="font-bold text-indigo-600 mr-2">[{p.order}]</span>
                      <span className="font-semibold">{p.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPhaseFormData(p)}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded"
                      >
                        Ред.
                      </button>
                      <button
                        onClick={() => handlePhaseDelete(p.id)}
                        className="text-sm bg-red-50 hover:bg-red-100 text-red-600 py-1 px-3 rounded"
                      >
                        Удал.
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Форма фазы */}
            <form onSubmit={handlePhaseSubmit} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-900">{phaseFormData.id === 0 ? '➕ Добавить фазу' : '📝 Редактировать фазу'}</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название фазы</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Фаза 1: Основы синтаксиса"
                  value={phaseFormData.title}
                  onChange={e => setPhaseFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание целей</label>
                <textarea
                  rows={2}
                  placeholder="Чему научится студент за эту фазу..."
                  value={phaseFormData.description ?? ''}
                  onChange={e => setPhaseFormData(prev => ({ ...prev, description: e.target.value || null }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                <input
                  type="number"
                  value={phaseFormData.order}
                  onChange={e => setPhaseFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold text-sm shadow disabled:opacity-50">
                  {phaseFormData.id === 0 ? 'Создать фазу' : 'Сохранить изменения'}
                </button>
                {phaseFormData.id !== 0 && (
                  <button type="button" onClick={() => setPhaseFormData({ ...BLANK_PHASE, profession_id: filterProfessionId })} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold text-sm">
                    Отмена
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ================= КОЛОНКА 2: ТЕМЫ ================= */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-t-lg border-b-2 border-emerald-200">
              <h2 className="text-xl font-bold text-emerald-900">Уровень 3: Темы (Внутри фаз)</h2>
            </div>

            {/* Список тем по фазам */}
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {currentPhases.map(phase => {
                const phaseTopics = currentTopics.filter(t => t.phase_id === phase.id)
                return (
                  <div key={phase.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Внутри: {phase.title}</h4>
                    {phaseTopics.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Нет тем в этой фазе</p>
                    ) : (
                      <div className="space-y-1">
                        {phaseTopics.map(t => (
                          <div key={t.id} className="flex justify-between items-center p-2 bg-white rounded border border-gray-100 text-sm">
                            <div>
                              <span className="font-bold text-emerald-600 mr-1">[{t.order}]</span>
                              <span>{t.title}</span>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => setTopicFormData(t)} className="text-xs bg-gray-100 text-gray-600 py-0.5 px-2 rounded hover:bg-gray-200">Ред.</button>
                              <button onClick={() => handleTopicDelete(t.id)} className="text-xs bg-red-50 text-red-500 py-0.5 px-2 rounded hover:bg-red-100">Удал.</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Форма темы */}
            <form onSubmit={handleTopicSubmit} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-900">{topicFormData.id === 0 ? '➕ Добавить тему' : '📝 Редактировать тему'}</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Родительская фаза</label>
                <select
                  required
                  value={topicFormData.phase_id}
                  onChange={e => setTopicFormData(prev => ({ ...prev, phase_id: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={0}>-- Выберите фазу, куда положить тему --</option>
                  {currentPhases.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название темы</label>
                <input
                  type="text"
                  required
                  placeholder="Например, Списки, кортежи и генераторы списков"
                  value={topicFormData.title}
                  onChange={e => setTopicFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание темы</label>
                <textarea
                  rows={2}
                  placeholder="Подробный план изучения темы, ключевые концепты..."
                  value={topicFormData.description ?? ''}
                  onChange={e => setTopicFormData(prev => ({ ...prev, description: e.target.value || null }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Полезные ресурсы <span className="text-gray-400 font-normal">(через запятую)</span></label>
                <input
                  type="text"
                  placeholder="https://docs.python.org, https://stepik.org/..."
                  value={topicFormData.resources ?? ''}
                  onChange={e => setTopicFormData(prev => ({ ...prev, resources: e.target.value || null }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Порядок темы</label>
                <input
                  type="number"
                  value={topicFormData.order}
                  onChange={e => setTopicFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading || currentPhases.length === 0} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold text-sm shadow disabled:opacity-50">
                  {topicFormData.id === 0 ? 'Создать тему' : 'Сохранить изменения'}
                </button>
                {topicFormData.id !== 0 && (
                  <button type="button" onClick={() => setTopicFormData({ ...BLANK_TOPIC, phase_id: currentPhases[0]?.id || 0 })} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold text-sm">
                    Отмена
                  </button>
                )}
              </div>
              {currentPhases.length === 0 && (
                <p className="text-xs text-red-500 italic">Сначала добавьте хотя бы одну Фазу в левой колонке!</p>
              )}
            </form>
          </div>

        </div>
      ) : (
        <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <p className="text-gray-500 font-medium">Пожалуйста, выберите профессию в списке выше, чтобы начать конструировать фазы и темы.</p>
        </div>
      )}
    </div>
  )
}