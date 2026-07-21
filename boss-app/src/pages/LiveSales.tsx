import { Clock, User } from 'lucide-react'

const MOCK_TABLES = [
  { id: 1, ad: 'Masa 1', bolum: 'Salon', tutar: 450.50, acilis: '19:30', kisi: 3, garson: 'Ahmet Y.' },
  { id: 2, ad: 'Masa 4', bolum: 'Salon', tutar: 1250.00, acilis: '18:45', kisi: 5, garson: 'Mehmet K.' },
  { id: 3, ad: 'Bahçe 2', bolum: 'Bahçe', tutar: 220.00, acilis: '20:15', kisi: 2, garson: 'Ayşe S.' },
  { id: 4, ad: 'Bahçe 5', bolum: 'Bahçe', tutar: 890.75, acilis: '19:00', kisi: 4, garson: 'Ayşe S.' },
  { id: 5, ad: 'Bar 1', bolum: 'Bar', tutar: 150.00, acilis: '20:45', kisi: 1, garson: 'Can T.' },
]

export default function LiveSales() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Canlı Masalar</h2>
        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm font-bold">
          {MOCK_TABLES.length} Açık Masa
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_TABLES.map(masa => (
          <div key={masa.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{masa.ad}</h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{masa.bolum}</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-blue-600">₺{masa.tutar.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 mt-6 border-t border-slate-50 pt-4">
              <div className="flex items-center gap-1.5">
                <Clock size={16} className="text-slate-400" />
                <span>{masa.acilis}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User size={16} className="text-slate-400" />
                <span>{masa.kisi} Kişi</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                  {masa.garson.charAt(0)}
                </div>
                <span className="font-medium text-slate-600">{masa.garson}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
