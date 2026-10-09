import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import MessageForm from './MessageForm'

const addMessage = vi.fn().mockResolvedValue(undefined)

vi.mock('shared/lib/useMessages', () => ({
  useMessages: () => ({
    addMessage,
    isLoadingAnswer: false,
    stopResponse: vi.fn()
  })
}))

describe('MessageForm', () => {
  it('submits with Enter and keeps Shift+Enter for a new line', () => {
    render(<MessageForm />)
    const input = screen.getByRole('textbox', { name: 'Message' })

    fireEvent.change(input, { target: { value: '  Test  ' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })
    expect(addMessage).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    expect(addMessage).toHaveBeenCalledWith('Test')
    expect(input).toHaveValue('')
  })
})
