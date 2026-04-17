/**
 * Accordion Component Tests
 */

import { render } from '@testing-library/react'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../accordion'

describe('Accordion', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Trigger</AccordionTrigger>
            <AccordionContent>Content</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    ).not.toThrow()
  })

  it('renders trigger', () => {
    const { getByText } = render(
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Test Trigger</AccordionTrigger>
          <AccordionContent>Test Content</AccordionContent>
        </AccordionItem>
      </Accordion>
    )

    expect(getByText('Test Trigger')).toBeInTheDocument()
  })

  it('renders multiple items', () => {
    expect(() =>
      render(
        <Accordion type="multiple">
          <AccordionItem value="item-1">
            <AccordionTrigger>Item 1</AccordionTrigger>
            <AccordionContent>Content 1</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Item 2</AccordionTrigger>
            <AccordionContent>Content 2</AccordionContent>
          </AccordionItem>
        </Accordion>
      )
    ).not.toThrow()
  })
})

