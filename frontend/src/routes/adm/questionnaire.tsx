import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import type { Question, QuestionOption, QuestionType } from '../../types/questionnaire'
import authFetch from '../../utils/api'

export const Route = createFileRoute('/adm/questionnaire')({
  component: RouteComponent,
})

// Начальное пустое состояние для формы создания/редактирования
const BLANK_QUESTION: Question = {
  id: 0,
  text: '',
  type: 'single',
  order: 1,
  is_active: true,
  options: []
}

function RouteComponent() {
  // Список всех вопросов с бэкенда
  const [questions, setQuestions] = useState<Question[]>([])
  
  // Состояние для формы (редактируемый или новый вопрос)
  const [formData, setFormData] = useState<Question>({ ...BLANK_QUESTION })
  
  // Флаг загрузки
  const [loading, setLoading] = useState(false)

  // 1. READ: Получение данных с бэкенда при загрузке страницы
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true)
      try {
        const response = await authFetch('/api/admin/questions/');
    
        if (!response.ok) {
          console.log(response.status);
          throw new Error('Не удалось загрузить данные опросника');
        }
    
        const data: Question[] = await response.json();

        setQuestions(data)
      } catch (error) {
        console.error('Ошибка загрузки:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  // 2. CREATE / UPDATE: Сохранение вопроса
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.text.trim()) {
      alert('Заполните текст вопроса');
      return;
    }

    if (formData.type === 'single' || formData.type === 'multi') {
      if (formData.options.length === 0) {
        alert('Добавьте хотя бы один вариант ответа');
        return;
      }
      if (formData.options.some(opt => !opt.trait?.trim())) {
        alert('Заполните trait для всех вариантов ответа');
        return;
      }
    }

    setLoading(true);
    try {
      if (formData.id) {
        // UPDATE
        const response = await authFetch(`/api/admin/questions/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Ошибка при обновлении');
        const updated: Question = await response.json();
        setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
      } else {
        // CREATE
        const response = await authFetch('/api/admin/questions/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        if (!response.ok) throw new Error('Ошибка при создании');
        const created: Question = await response.json();
        setQuestions(prev => [...prev, created]);
      }

      setFormData({ ...BLANK_QUESTION });
    } catch (error) {
      alert('Ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async (id: number) => {
  if (!confirm('Удалить вопрос?')) return;

  setLoading(true);
  try {
    const response = await authFetch(`/api/admin/questions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Ошибка при удалении');
    setQuestions(prev => prev.filter(q => q.id !== id));
  } catch (error) {
    alert('Ошибка при удалении');
  } finally {
    setLoading(false);
  }
};

  // --- РАБОТА С ВАРИАНТАМИ ОТВЕТОВ ВНУТРИ ФОРМЫ ---
  
  // Добавить пустой вариант ответа в форму
  const addOptionField = () => {
    const nextOrder = formData.options.length + 1
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { 
        id: Date.now(), // временно для key в реакте, пока бэк не сохранил
        question_id: prev.id, 
        text: "Новый ответ", 
        trait: "...", 
        order: 1 
      }]
    }))
  }

  // Удалить вариант ответа из формы
  const removeOptionField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options
        .filter((_, i) => i !== index)
        .map((opt, i) => ({ ...opt, order: i + 1 })),
    }))
  }

  // Изменить конкретное поле варианта ответа
  const updateOptionField = (index: number, key: keyof QuestionOption, value: any) => {
    setFormData(prev => {
      const updatedOptions = [...prev.options]
      updatedOptions[index] = { ...updatedOptions[index], [key]: value }
      return { ...prev, options: updatedOptions }
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Управление Опросником</h1>

      {/* Сетка: Слева список вопросов, Справа форма редактирования/создания */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ЛЕВАЯ ЧАСТЬ: СПИСОК ВОПРОСОВ */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Существующие вопросы ({questions.length})</h2>
          
          {loading && <div className="text-gray-500">Загрузка данных...</div>}
          
          {questions.length === 0 && !loading && (
            <div className="p-4 border border-dashed rounded text-gray-400 text-center">Вопросов пока нет. Создайте первый!</div>
          )}

          {[...questions].sort((a, b) => a.order - b.order)
            .map((q) => (
              <div 
                key={q.id} 
                className={`p-5 border rounded-lg shadow-sm transition-all bg-white ${formData.id === q.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-gray-200'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded font-mono mr-2">Порядок: {q.order}</span>
                    <span className={`inline-block text-xs px-2 py-1 rounded ${q.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {q.is_active ? 'Активен' : 'Скрыт'}
                    </span>
                    <span className="ml-2 inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded capitalize">{q.type}</span>
                  </div>
                  
                  {/* Кнопки действий */}
                  <div className="space-x-2">
                    <button 
                      onClick={() => setFormData({ ...q })}
                      className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded transition"
                    >
                      Редактировать
                    </button>
                    <button 
                      onClick={() => q.id && handleDelete(q.id)}
                      className="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                    >
                      Удалить
                    </button>
                  </div>
                </div>

                <p className="text-lg font-medium text-gray-900 mb-3">{q.text}</p>

                {/* Варианты ответов этого вопроса */}
                {q.options.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded border border-gray-100 space-y-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Варианты ответов:</p>
                    {[...q.options].sort((a, b) => a.order - b.order)
                      .map((opt, idx) => (
                        <div key={opt.id || idx} className="text-sm text-gray-700 flex justify-between">
                          <span>{opt.order}. {opt.text}</span>
                          {opt.trait && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Trait: {opt.trait}</span>}
                        </div>
                    ))}
                  </div>
                )}
              </div>
          ))}
        </div>

        {/* ПРАВАЯ ЧАСТЬ: ФОРМА УПРАВЛЕНИЯ */}
        <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-md h-fit sticky top-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {formData.id ? 'Редактировать вопрос' : 'Новый вопрос'}
            </h2>
            {formData.id && (
              <button 
                type="button" 
                onClick={() => setFormData({ ...BLANK_QUESTION })}
                className="text-xs text-blue-600 hover:underline"
              >
                Сбросить / Новый
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Текст вопроса */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Текст вопроса</label>
              <textarea
                rows={3}
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите текст вопроса..."
              />
            </div>

            {/* Тип и Порядок */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип ответа</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as QuestionType }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="single">Один выбор (Single)</option>
                  <option value="multi">Множественный (Multi)</option>
                  <option value="free_text">Свободный текст</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Чекбокс активности */}
            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                Отображать этот вопрос пользователям
              </label>
            </div>

            <hr className="border-gray-200 my-4" />

            {/* ДИНАМИЧЕСКИЙ БЛОК ДЛЯ ВАРИАНТОВ ОТВЕТОВ */}
            {formData.type !== 'free_text' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-bold text-gray-700">Варианты ответов</label>
                  <button
                    type="button"
                    onClick={addOptionField}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition"
                  >
                    + Добавить вариант
                  </button>
                </div>

                {formData.options.length === 0 && (
                  <p className="text-xs text-amber-600 italic">Добавьте хотя бы один вариант ответа для типов single/multi</p>
                )}

                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {formData.options.map((opt, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50 space-y-2 relative">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-400">#{index + 1}</span>
                        <input
                          type="text"
                          placeholder="Текст ответа"
                          value={opt.text}
                          onChange={(e) => updateOptionField(index, 'text', e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => removeOptionField(index)}
                          className="text-red-500 hover:text-red-700 font-bold px-1"
                          title="Удалить вариант"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Доп. параметры варианта (Trait и Order) */}
                      <div className="grid grid-cols-2 gap-2 pl-5">
                        <input
                          type="text"
                          placeholder="Психотип / Черта (Trait)"
                          value={opt.trait || ''}
                          onChange={(e) => updateOptionField(index, 'trait', e.target.value || null)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Порядок"
                          value={opt.order}
                          onChange={(e) => updateOptionField(index, 'order', parseInt(e.target.value) || 1)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Главная кнопка отправки формы */}
            <button
              type="submit"
              className="w-full font-semibold py-2 px-4 rounded-md text-white transition bg-blue-600 hover:bg-blue-700 shadow"
            >
              {formData.id ? 'Сохранить изменения' : 'Создать вопрос'}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}