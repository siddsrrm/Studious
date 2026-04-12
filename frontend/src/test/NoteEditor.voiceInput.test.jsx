import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NoteEditor from '../components/NoteEditor'


describe('NoteEditor voice input', () => {
  beforeEach(() => {
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
  })

  it('shows an error when browser does not support SpeechRecognition', async () => {
    const onUpdate = vi.fn()
    render(
      <NoteEditor
        note={{ _id: '1', title: 't', content: '<p>Hello</p>', tags: [] }}
        onUpdate={onUpdate}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /voice/i }))

    expect(
      await screen.findByText(/isn't supported in this browser/i)
    ).toBeTruthy()
  })
})
