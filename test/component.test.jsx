import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import { test, expect, vi, afterEach } from 'vitest'
import { PostgresQueryBox, schemaFromFields, validate } from '../src/index.js'

afterEach(cleanup)

const schema = schemaFromFields([
  { path: 'data.request.verb', type: 'string' },
  { path: 'data.response.statusCode', type: 'numtext' },
  { path: 'data.request.path', type: 'string' },
  { path: 'metadata.clientIp', type: 'ip' }
])

const saved = [
  { id: '1', name: 'Server errors', query: 'data.response.statusCode >= 500', pinned: true },
  { id: '2', name: 'Writes', query: 'data.request.verb ANYONE ["POST", "PUT"]' }
]

test('validate reports errors in plain words', () => {
  expect(validate('data.request.verb == "GET"', schema)).toBe('')
  expect(validate('(data.request.verb == "GET"', schema)).toMatch(/Close the group/)
})

test('typing a field suggests operators and Run sends the query', () => {
  const onRun = vi.fn()
  render(<PostgresQueryBox schema={schema} onRun={onRun} />)
  const box = screen.getByLabelText('Filter')
  fireEvent.focus(box)
  fireEvent.change(box, { target: { value: 'data.request.verb ', selectionStart: 18 } })
  expect(screen.getAllByText(/^OPERATORS/).length).toBeGreaterThan(0)
  fireEvent.change(box, { target: { value: 'data.request.verb == "GET"', selectionStart: 26 } })
  fireEvent.click(screen.getByText('Run query'))
  expect(onRun).toHaveBeenCalledWith('data.request.verb == "GET"', expect.any(Object))
})

test('errors are shown on run and nothing is sent', () => {
  const onRun = vi.fn()
  render(<PostgresQueryBox schema={schema} defaultValue='data.request.verb ANYONE ["GET"' onRun={onRun} />)
  fireEvent.click(screen.getByText('Run query'))
  expect(onRun).not.toHaveBeenCalled()
  expect(screen.getByText(/Close the list with \]/)).toBeTruthy()
})

test('saved queries panel calls back and loads a query', () => {
  const onRun = vi.fn()
  const onPinSaved = vi.fn()
  const onSaveQuery = vi.fn()
  const onUpdateSaved = vi.fn()
  const onDeleteSaved = vi.fn()
  const onCreateAlert = vi.fn()
  render(<PostgresQueryBox schema={schema} defaultValue='data.request.path CONTAINS "/health"' onRun={onRun} saved={saved} onPinSaved={onPinSaved} onSaveQuery={onSaveQuery} onUpdateSaved={onUpdateSaved} onDeleteSaved={onDeleteSaved} onCreateAlert={onCreateAlert} />)
  fireEvent.click(screen.getByText('Queries'))
  expect(screen.getByText('PINNED')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Pin Writes'))
  expect(onPinSaved).toHaveBeenCalledWith(saved[1], true)
  fireEvent.click(screen.getByLabelText('Edit Writes'))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Write calls' } })
  fireEvent.click(screen.getByText('Save'))
  expect(onUpdateSaved).toHaveBeenCalledWith(saved[1], { name: 'Write calls', query: 'data.request.verb ANYONE ["POST", "PUT"]' })
  fireEvent.click(screen.getByLabelText('Delete Writes'))
  fireEvent.click(screen.getByText('Delete'))
  expect(onDeleteSaved).toHaveBeenCalledWith(saved[1])
  fireEvent.click(screen.getByLabelText('Create an alert from Writes'))
  expect(onCreateAlert).toHaveBeenCalledWith('data.request.verb ANYONE ["POST", "PUT"]', expect.any(Object))
  fireEvent.click(screen.getByText('Queries'))
  act(() => {
    fireEvent.click(screen.getByText('Server errors'))
  })
  expect(onRun).toHaveBeenCalledWith('data.response.statusCode >= 500', expect.any(Object))
})

test('Save opens a popover and saves the current query', () => {
  const onSaveQuery = vi.fn()
  render(<PostgresQueryBox schema={schema} defaultValue='data.request.path CONTAINS "/health"' saved={saved} onSaveQuery={onSaveQuery} />)
  fireEvent.focus(screen.getByLabelText('Filter'))
  fireEvent.click(screen.getByText('Save'))
  expect(screen.getByText('Save query as')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Health checks' } })
  fireEvent.click(screen.getByLabelText('Save query as').querySelector('input[type=checkbox]'))
  fireEvent.click(screen.getAllByText('Save').at(-1))
  expect(onSaveQuery).toHaveBeenCalledWith({ name: 'Health checks', query: 'data.request.path CONTAINS "/health"', pinned: true })
})
