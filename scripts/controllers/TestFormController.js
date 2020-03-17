import DefaultFormController from "./base-controllers/DefaultFormController.js";

export default class TestFormController extends DefaultFormController {
    constructor(element) {
        super(element, {
            sectionTitle: {
                label: "Your personal information"
            },
            name: {
                label: "Name",
                name: "name",
                required: true,
                placeholder: "Name here...",
                value: ''
            },
            email: {
                label: "Email address",
                name: "email",
                required: true,
                placeholder: "Email address here...",
                value: ''
            },
            age: {
                label: "Your age",
                name: "age",
                required: false,
                placeholder: "Your age here...",
                value: ''
            },
            dateOfBirth: {
                label: "Select from the calendar your birth date",
                name: "date-of-birth",
                required: false,
                value: ''
            },
            password: {
                label: "Write down your password.",
                hint: "The submition will create an account using your name and password.",
                name: "password",
                required: false,
                placeholder: "Password here...",
                value: ''
            },
            gender: {
                label: "Select your gender",
                required: true,
                options: [{
                        label: "Male"
                    },
                    {
                        label: "Female",
                        value: "F"
                    }
                ]
            },
            nationality: {
                label: "Select your nationality",
                placeholder: "Please select one option...",
                required: true,
                options: [{
                    label: "Romanian",
                    value: "RO"
                }]
            },
            gdpr: {
                label: "Check if you agree with GDPR regulations",
                name: "gdpr",
                required: true,
                checkboxLabel: "GDPR Consent",
                checkedValue: "yes",
                uncheckedValue: "no"
            },
            terms: {
                label: "Do you accept our terms and conditions?",
                name: "terms",
                required: true,
                checkboxLabel: "Terms & Conditions",
                checkedValue: "yes",
                uncheckedValue: "no"
            }
        });
    }
}