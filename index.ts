'use client'

import React, { useState } from "react"
import { ZodSchema } from "zod"

interface Register{
    name: string,
    onChange: React.ChangeEventHandler<HTMLInputElement>
}
type Error<T> = {[Input in keyof T]?: {
    message: string
}}
interface UseReactForm<T>{
    handleSubmit: (event: React.FormEvent<HTMLFormElement>, submit: (data: T) => void) => void,
    registerInput: (name: keyof T) => Register,
    formError: Error<T>,
    setInputError: (input: keyof T, message: string) => void,
    isSubmitting: boolean,
    setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>,
    formWasChanged: boolean,
    setFormWasChanged: React.Dispatch<React.SetStateAction<boolean>>
}

export default function useReactForm <T> (zodSchema: ZodSchema): UseReactForm<T> {
    const [formError, setFormError] = useState<Error<T>>({})
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [formWasChanged, setFormWasChanged] = useState<boolean>(false)

    function registerInput(name: keyof T): Register {
        return {
            name: name as string,
            onChange: () => {
                !formWasChanged && setFormWasChanged(true)

                if(formError){
                    if(formError[name]){
                        delete formError[name]
    
                        setFormError({...formError})
                    }
                }
            }
        }
    }

    function handleSubmit (event: React.FormEvent<HTMLFormElement>, submit: (data: T) => void): void {
        event.preventDefault()
        
        setIsSubmitting(true)

        const formData = new FormData(event.currentTarget)

        const formInputs = formData.keys()

        const result: T = {} as T

        // @ts-ignore
        for (const inputName of formInputs){
            const inputValue = formData.getAll(inputName)

            if(inputValue.length > 1){
                // @ts-ignore
                result[inputName] = inputValue
            }else{
                // @ts-ignore
                result[inputName] = inputValue[0]
            }
        }

        const parseResult = zodSchema.safeParse(result)

        if(!parseResult.success){
            // @ts-ignore
            const errors: Error<T> = {}

            for(const _error of parseResult.error.errors){
                // @ts-ignore
                errors[_error.path[0]] = {
                    message: _error.message
                }
            }

            setFormError(errors)
            setIsSubmitting(false)

            return
        }

        submit(result)
    }

    function setInputError(input: keyof T, message: string): void {
        formError[input] = {
            message: message
        }

        setFormError({...formError})
    }

    return {
        handleSubmit,
        registerInput,
        formError,
        setInputError,
        isSubmitting,
        setIsSubmitting,
        formWasChanged,
        setFormWasChanged
    }
}