document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const descInput = document.getElementById('desc');
    const amountInput = document.getElementById('amount');
    const typeSelect = document.getElementById('type');
    const categoryGroup = document.getElementById('category-group');
    const categorySelect = document.getElementById('category');
    
    const totalBalanceEl = document.getElementById('total-balance');
    const totalIncomeEl = document.getElementById('total-income');
    const totalExpenseEl = document.getElementById('total-expense');
    const transactionListEl = document.getElementById('transaction-list');
    
    const exportCsvBtn = document.getElementById('export-csv');
    const exportPdfBtn = document.getElementById('export-pdf');

    // Initialize transactions array from local storage
    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

    // Format currency to Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // Format Date
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    };

    // Show/hide category based on transaction type
    typeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'expense') {
            categoryGroup.style.display = 'block';
        } else {
            categoryGroup.style.display = 'none';
        }
    });

    // Generate random ID
    const generateID = () => {
        return Math.floor(Math.random() * 100000000);
    };

    // Add new transaction
    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const desc = descInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const type = typeSelect.value;
        const category = type === 'expense' ? categorySelect.value : 'Pemasukan';

        if (desc === '' || isNaN(amount) || amount <= 0) {
            alert('Silakan masukkan keterangan dan jumlah yang valid.');
            return;
        }

        const transaction = {
            id: generateID(),
            desc,
            amount,
            type,
            category,
            date: new Date().toISOString()
        };

        transactions.push(transaction);
        updateLocalStorage();
        init();

        // Reset form
        descInput.value = '';
        amountInput.value = '';
        typeSelect.value = 'income';
        categoryGroup.style.display = 'none';
    });

    // Remove transaction
    window.removeTransaction = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
            transactions = transactions.filter(t => t.id !== id);
            updateLocalStorage();
            init();
        }
    };

    // Update Local Storage
    const updateLocalStorage = () => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    };

    // Add transaction to DOM list
    const addTransactionDOM = (transaction) => {
        const tr = document.createElement('tr');
        
        const typeBadge = transaction.type === 'income' 
            ? '<span class="badge badge-income">Pemasukan</span>' 
            : '<span class="badge badge-expense">Pengeluaran</span>';
            
        const amountClass = transaction.type === 'income' ? 'text-success' : 'text-danger';
        const sign = transaction.type === 'income' ? '+' : '-';

        tr.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td>${transaction.desc}</td>
            <td>${transaction.category}</td>
            <td>${typeBadge}</td>
            <td style="color: ${transaction.type === 'income' ? 'var(--success)' : 'var(--danger)'}; font-weight: 500;">
                ${sign} ${formatRupiah(transaction.amount)}
            </td>
            <td>
                <button class="action-btn" onclick="removeTransaction(${transaction.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        transactionListEl.appendChild(tr);
    };

    // Update dashboard values
    const updateValues = () => {
        const amounts = transactions.map(t => t.type === 'income' ? t.amount : -t.amount);
        
        const total = amounts.reduce((acc, item) => (acc += item), 0);
        
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((acc, t) => (acc += t.amount), 0);
            
        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((acc, t) => (acc += t.amount), 0);

        totalBalanceEl.innerText = formatRupiah(total);
        totalIncomeEl.innerText = formatRupiah(income);
        totalExpenseEl.innerText = formatRupiah(expense);
    };

    // Init App
    const init = () => {
        transactionListEl.innerHTML = '';
        // Sort transactions by date descending
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedTransactions.forEach(addTransactionDOM);
        updateValues();
    };

    // Export to CSV
    exportCsvBtn.addEventListener('click', () => {
        if (transactions.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Tanggal,Keterangan,Kategori,Jenis,Jumlah\n";

        transactions.forEach(t => {
            const date = formatDate(t.date).replace(/,/g, '');
            const typeIndo = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            const row = `${date},${t.desc},${t.category},${typeIndo},${t.amount}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Laporan_Keuangan_${new Date().toLocaleDateString('id-ID')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Export to PDF
    exportPdfBtn.addEventListener('click', () => {
        if (transactions.length === 0) {
            alert('Tidak ada data untuk diekspor.');
            return;
        }

        // Create a temporary container for PDF content
        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Inter, sans-serif';
        
        // Build HTML for PDF
        let html = `
            <h1 style="color: #4361ee; text-align: center; margin-bottom: 20px;">Laporan Keuangan</h1>
            <p style="text-align: center; margin-bottom: 30px; color: #666;">Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #8d99ae; font-size: 14px;">Total Pemasukan</h3>
                    <p style="margin: 0; color: #2ecc71; font-weight: bold; font-size: 18px;">${totalIncomeEl.innerText}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #8d99ae; font-size: 14px;">Total Pengeluaran</h3>
                    <p style="margin: 0; color: #e74c3c; font-weight: bold; font-size: 18px;">${totalExpenseEl.innerText}</p>
                </div>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0; color: #8d99ae; font-size: 14px;">Saldo Akhir</h3>
                    <p style="margin: 0; color: #4361ee; font-weight: bold; font-size: 18px;">${totalBalanceEl.innerText}</p>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f8f9fa;">
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #333;">Tanggal</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #333;">Keterangan</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #333;">Kategori</th>
                        <th style="padding: 12px; text-align: left; border-bottom: 2px solid #ddd; color: #333;">Jenis</th>
                        <th style="padding: 12px; text-align: right; border-bottom: 2px solid #ddd; color: #333;">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedTransactions.forEach(t => {
            const typeIndo = t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
            const color = t.type === 'income' ? '#2ecc71' : '#e74c3c';
            const sign = t.type === 'income' ? '+' : '-';
            
            html += `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; color: #555;">${formatDate(t.date)}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; color: #555;">${t.desc}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; color: #555;">${t.category}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; color: ${color}; font-weight: 500;">${typeIndo}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; color: ${color}; text-align: right; font-weight: 500;">
                        ${sign} ${formatRupiah(t.amount)}
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        
        element.innerHTML = html;

        // Configuration for html2pdf
        const opt = {
            margin:       10,
            filename:     `Laporan_Keuangan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generate PDF
        html2pdf().set(opt).from(element).save();
    });

    // Start App
    init();
});
