/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom'
import '@testing-library/jest-dom'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import BillsUI from '../views/BillsUI.js'
import { ROUTES, ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store'
import { bills } from '../fixtures/bills.js'
import router from '../app/Router.js'

jest.mock('../app/store', () => mockStore)

describe('Given I am connected as an employee', () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })

  window.localStorage.setItem(
    'user',
    JSON.stringify({
      type: 'Employee',
    })
  )

  const onNavigate = (pathname) => {
    document.body.innerHTML = ROUTES({ pathname, data: bills })
  }

  describe('When I am on NewBill Page', () => {
    test('Then email icon in vertical layout should be highlighted', async () => {
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const emailIcon = screen.getByTestId('icon-mail')

      expect(emailIcon).toHaveClass('active-icon')

      document.body.removeChild(root)
    })
  })

  describe('When I am on NewBill page and I upload a file with an extension other than jpg, jpeg or png', () => {
    test('Then an error message for the file input should be displayed', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        bills: bills,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByLabelText('Justificatif')
      fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.pdf', {
              type: 'application/pdf',
            }),
          ],
        },
      })

      expect(handleChangeFile).toHaveBeenCalled()

      expect(fileInput.files[0].name).toBe('test.pdf')

      const errorMessage = screen.getByTestId('file-error-message')

      expect(errorMessage).not.toHaveClass('hidden')
    })
  })

  describe('When I am on the NewBill page and I upload a file with a jpg, jpeg or png extension', () => {
    test('Then no error message should be displayed', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e))

      const fileInput = screen.getByLabelText('Justificatif')
      fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        },
      })

      expect(handleChangeFile).toHaveBeenCalled()

      expect(fileInput.files[0].name).toBe('test.jpg')

      const errorMessage = screen.getByTestId('file-error-message')

      expect(errorMessage).toHaveClass('hidden')
    })
  })

  describe('When I am on NewBill page, I filled in the form correctly and I clicked on submit button', () => {
    test('Then Bills page should be rendered', () => {
      document.body.innerHTML = NewBillUI()

      const newBill = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      })

      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      newBill.fileName = 'test.jpg'

      const formNewBill = screen.getByTestId('form-new-bill')
      formNewBill.addEventListener('submit', handleSubmit)

      fireEvent.submit(formNewBill)

      expect(handleSubmit).toHaveBeenCalled()

      expect(screen.getByText('Mes notes de frais')).toBeTruthy()
    })
  })
})

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill page and submit a valid form', () => {
    test('Then a new bill should be created in the API', async () => {
      document.body.innerHTML = NewBillUI()

      const earlyBillInfos = {
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        email: "a@a",
      }

      const mockedBills = mockStore.bills()

      const spyCreate = jest.spyOn(mockedBills, 'create')
      const spyUpdate = jest.spyOn(mockedBills, "update")

      const billCreated = await spyCreate(earlyBillInfos)

      expect(spyCreate).toHaveBeenCalled()

      expect(billCreated.key).toBe('47qAXb6fIm2zOKkLzMro')
      expect(billCreated.fileUrl).toBeUndefined()
      expect(billCreated.fileName).toBe("preview-facture-free-201801-pdf-1.jpg")

      const completeBillInfos = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl: "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20
      }

      const billUpdated = await spyUpdate(completeBillInfos)

      expect(billUpdated.id).toBe("47qAXb6fIm2zOKkLzMro")
      expect(billUpdated.fileUrl).toBe("https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a")
      expect(billUpdated.fileName).toBe("preview-facture-free-201801-pdf-1.jpg")
    })
  })

  describe('When an error occurs on API', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'a@a',
        })
      )

      document.body.innerHTML = NewBillUI()
    })

    test('Then new bill are added to the API but fetch fails with 404 message error', async () => {
      const spyedMockStore = jest.spyOn(mockStore, 'bills')

      spyedMockStore.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error('Erreur 404')),
        }
      })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname, data: bills })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByLabelText('Justificatif')

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        },
      })

      await spyedMockStore()

      expect(spyedMockStore).toHaveBeenCalled()

      expect(newBill.billId).toBeNull()
      expect(newBill.fileUrl).toBeNull()

      spyedMockStore.mockReset()
      spyedMockStore.mockRestore()
    })

    test('Then new bill are added to the API but fetch fails with 500 message error', async () => {
      const spyedMockStore = jest.spyOn(mockStore, 'bills')

      spyedMockStore.mockImplementationOnce(() => {
        return {
          create: jest.fn().mockRejectedValue(new Error('Erreur 500')),
        }
      })

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname, data: bills })
      }

      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        bills: bills,
        localStorage: window.localStorage,
      })

      const fileInput = screen.getByLabelText('Justificatif')

      fireEvent.change(fileInput, {
        target: {
          files: [
            new File(['test'], 'test.jpg', {
              type: 'image/jpeg',
            }),
          ],
        },
      })

      await spyedMockStore()

      expect(spyedMockStore).toHaveBeenCalled()

      expect(newBill.billId).toBeNull()
      expect(newBill.fileUrl).toBeNull()
    })
  })
})
