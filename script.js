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

    const searchTxInput = document.getElementById('search-tx');
    const filterTypeSelect = document.getElementById('filter-type');

    let transactions = [];

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
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        let formatted = new Date(dateString).toLocaleDateString('id-ID', options);
        return formatted.replace(/\./g, ':');
    };

    // Format input currency dynamically
    amountInput.addEventListener('input', function(e) {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value) {
            this.value = new Intl.NumberFormat('id-ID').format(parseInt(value, 10));
        } else {
            this.value = '';
        }
    });

    const incomeCategories = ['Gaji', 'Bonus', 'Hasil Usaha', 'Lainnya'];
    const expenseCategories = ['Makanan', 'Transportasi', 'Hiburan', 'Tabungan', 'Kos', 'Edukasi', 'Lainnya'];

    const updateCategoryOptions = () => {
        const type = typeSelect.value;
        const options = type === 'income' ? incomeCategories : expenseCategories;
        categorySelect.innerHTML = options.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    };

    typeSelect.addEventListener('change', updateCategoryOptions);
    updateCategoryOptions();

    // Fetch transactions from API
    const fetchTransactions = async () => {
        try {
            const res = await fetch('api.php');
            const data = await res.json();
            transactions = data;
            init();
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Add new transaction
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const desc = descInput.value.trim();
        const amountStr = amountInput.value.replace(/\./g, '');
        const amount = parseFloat(amountStr);
        const type = typeSelect.value;
        const category = categorySelect.value;

        if (desc === '' || isNaN(amount) || amount <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Silakan masukkan keterangan dan jumlah yang valid (minimal Rp 1).'
            });
            return;
        }

        const transaction = {
            desc,
            amount,
            type,
            category
        };

        try {
            const res = await fetch('api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });
            const result = await res.json();
            
            if (result.status === 'success') {
                // Refresh data
                fetchTransactions();
                
                // Reset form
                descInput.value = '';
                amountInput.value = '';
                typeSelect.value = 'income';
                updateCategoryOptions();
                // Toast Success
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Transaksi berhasil disimpan!',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                Swal.fire('Gagal!', result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    });

    // Remove transaction
    window.removeTransaction = (id) => {
        Swal.fire({
            title: 'Hapus Transaksi?',
            text: "Apakah Anda yakin ingin menghapus transaksi ini?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#8d99ae',
            confirmButtonText: 'Ya, Hapus!',
            cancelButtonText: 'Batal'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`api.php?id=${id}`, {
                        method: 'DELETE'
                    });
                    const resData = await res.json();
                    
                    if (resData.status === 'success') {
                        fetchTransactions();
                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'Transaksi berhasil dihapus!',
                            showConfirmButton: false,
                            timer: 3000
                        });
                    } else {
                        Swal.fire('Gagal!', resData.message, 'error');
                    }
                } catch (error) {
                    console.error('Error deleting data:', error);
                    Swal.fire('Error', 'Terjadi kesalahan pada sistem.', 'error');
                }
            }
        });
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

        updateChart(income, expense);
    };

    let financeChartInstance = null;

    const updateChart = (income, expense) => {
        const chartCanvas = document.getElementById('financeChart');
        if (!chartCanvas) return;
        
        const ctx = chartCanvas.getContext('2d');
        if (financeChartInstance) {
            financeChartInstance.destroy();
        }
        financeChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Pemasukan', 'Pengeluaran'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#2ecc71', '#e74c3c'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    };

    // Filter and Render Transactions
    const renderTransactions = () => {
        transactionListEl.innerHTML = '';
        const searchTerm = searchTxInput ? searchTxInput.value.toLowerCase() : '';
        const filterType = filterTypeSelect ? filterTypeSelect.value : 'all';

        const filtered = transactions.filter(t => {
            const matchSearch = t.desc.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm);
            const matchType = filterType === 'all' || t.type === filterType;
            return matchSearch && matchType;
        });

        if (filtered.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-wallet"></i>
                        <p>Belum ada transaksi hari ini. Yuk, catat pengeluaranmu!</p>
                    </div>
                </td>
            `;
            transactionListEl.appendChild(tr);
        } else {
            filtered.forEach(addTransactionDOM);
        }
    };

    if (searchTxInput) searchTxInput.addEventListener('input', renderTransactions);
    if (filterTypeSelect) filterTypeSelect.addEventListener('change', renderTransactions);

    // Init App
    const init = () => {
        renderTransactions();
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

        const element = document.createElement('div');
        element.style.padding = '20px';
        element.style.fontFamily = 'Inter, sans-serif';
        
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

        transactions.forEach(t => {
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

        const opt = {
            margin:       10,
            filename:     `Laporan_Keuangan_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save();
    });

    // Start App by Fetching API
    fetchTransactions();

    // Profile Dropdown Toggle
    const userMenuBtn = document.getElementById('user-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');

    if (userMenuBtn && profileDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }
});
