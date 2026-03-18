/**
 * FormField Component
 *
 * A react-hook-form wrapper for form inputs with validation.
 */

import React from 'react';
import { Controller, ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { TextInput, TextInputProps } from '../ui/TextInput';

interface FormFieldProps<TFieldValues extends FieldValues>
  extends Omit<TextInputProps, 'onChangeText'> {
  control: ControllerProps<TFieldValues>['control'];
  name: FieldPath<TFieldValues>;
  rules?: ControllerProps<TFieldValues>['rules'];
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  rules,
  ...textInputProps
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <TextInput
          {...textInputProps}
          value={value}
          onChangeText={onChange}
          error={error?.message}
        />
      )}
    />
  );
}
