/**
 * Native Select Component Tests
 */

import { render } from '@testing-library/react'
import {
  NativeSelect,
  NativeSelectGroup,
  NativeSelectValue,
  NativeSelectTrigger,
  NativeSelectContent,
  NativeSelectLabel,
  NativeSelectSeparator,
  NativeSelectItem,
} from '../native-select'

describe('NativeSelect', () => {
  it('renders without crashing', () => {
    expect(() =>
      render(
        <NativeSelect>
          <NativeSelectTrigger>
            <NativeSelectValue placeholder="Select an option" />
          </NativeSelectTrigger>
          <NativeSelectContent>
            <NativeSelectGroup>
              <NativeSelectLabel>Options</NativeSelectLabel>
              <NativeSelectItem value="1">Option 1</NativeSelectItem>
              <NativeSelectItem value="2">Option 2</NativeSelectItem>
              <NativeSelectSeparator />
              <NativeSelectItem value="3">Option 3</NativeSelectItem>
            </NativeSelectGroup>
          </NativeSelectContent>
        </NativeSelect>
      )
    ).not.toThrow()
  })

  it('renders trigger with placeholder', () => {
    const { getByText } = render(
      <NativeSelect>
        <NativeSelectTrigger>
          <NativeSelectValue placeholder="Choose option" />
        </NativeSelectTrigger>
      </NativeSelect>
    )

    expect(getByText('Choose option')).toBeInTheDocument()
  })
})
