import VerticalLayout from "./VerticalLayout.js"
import ErrorPage from "./ErrorPage.js"
import LoadingPage from "./LoadingPage.js"

import Actions from "./Actions.js"

const row = (bill) => {
	return `
    <tr>
      <td>${bill.type}</td>
      <td>${bill.name}</td>
      <td>${bill.date}</td>
      <td>${bill.amount} €</td>
      <td>${bill.status}</td>
      <td>
        ${Actions(bill.fileUrl)}
      </td>
    </tr>
    `
}

const rows = (data) => {
	return data && data.length ? data.map((bill) => row(bill)).join("") : ""
}

const sortBills = (bills) => {
	const antiChrono = (a, b) => (a.date < b.date ? 1 : -1)

	return [...bills].sort(antiChrono)
}

export default ({ data: bills, loading, error }) => {
	const modal = () => `
    <div class="modal fade" id="modaleFile" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLongTitle">Justificatif</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
          </div>
        </div>
      </div>
    </div>
  `

	if (loading) {
		return LoadingPage()
	} else if (error) {
		return ErrorPage(error)
	}

	let billsSorted = []

	const validBills = (snap) => (snap.date === null ? true : false)
	const invalidBills = (snap) => (snap.date === null ? false : true)

	const cleanedBills = bills.filter(invalidBills)
	let incriminateBills = []

	try {
		if (cleanedBills.length !== 0) {
			incriminateBills = bills.filter(validBills)

			billsSorted = sortBills(cleanedBills)

			throw TypeError(
				`One or mulptiple bill(s) contains invalid value(s) and was filtered to not display on the bills page`
			)
		}

		billsSorted = sortBills(bills)
	} catch (e) {
		console.log(e, "for")
		console.group()
		incriminateBills.forEach((incriminateBill) => console.log(incriminateBill))
		console.groupEnd()
	}

	return `
    <div class='layout'>
      ${VerticalLayout(120)}
      <div class='content'>
        <div class='content-header'>
          <div class='content-title'> Mes notes de frais </div>
          <button type="button" data-testid='btn-new-bill' class="btn btn-primary">Nouvelle note de frais</button>
        </div>
        <div id="data-table">
        <table id="example" class="table table-striped" style="width:100%">
          <thead>
              <tr>
                <th>Type</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
          </thead>
          <tbody data-testid="tbody">
            ${rows(billsSorted)}
          </tbody>
          </table>
        </div>
      </div>
      ${modal()}
    </div>`
}
