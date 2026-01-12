'use client'

import { useState, useEffect } from 'react'
import { MdClose, MdAdd, MdDelete, MdBlock, MdCheckCircle } from 'react-icons/md'
import {
  getServiceAvailability,
  blockDate,
  unblockDate,
  addEventToDate,
  removeEventFromDate
} from '@/lib/firestore-availability'
import {
  parseDateKey,
  CalendarEvent
} from '@/lib/firestore-utils'

interface DateModalProps {
  isOpen: boolean
  onClose: () => void
  date: string // yyyy-mm-dd format
  serviceId: string
  service: {
    vendorId: string
    cityId: string
    serviceCategory: string
  }
  onUpdate: () => void
  mode?: 'admin' | 'vendor'
}

export default function DateModal({ isOpen, onClose, date, serviceId, service, onUpdate, mode = 'vendor' }: DateModalProps) {
  const [status, setStatus] = useState<'available' | 'blocked' | 'booked'>('available')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    eventType: '',
    startTime: '00:01',
    endTime: '23:59',
    customerName: '',
    customerPhone: '',
    customerAltPhone: '',
    customerAddress: '',
    additionalNotes: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchDateData()
    }
  }, [isOpen, date])

  const fetchDateData = async () => {
    setLoading(true)
    try {
      const dateObj = parseDateKey(date)
      const availabilityDoc = await getServiceAvailability(serviceId, dateObj)
      
      if (availabilityDoc && availabilityDoc.calendar[date]) {
        const dayData = availabilityDoc.calendar[date]
        setStatus(dayData.status)
        setEvents(dayData.events || [])
      } else {
        // Date doesn't exist in calendar MAP = available
        setStatus('available')
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching date data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBlockDate = async () => {
    setSaving(true)
    try {
      const dateObj = parseDateKey(date)
      await blockDate(serviceId, service.vendorId, service.cityId, service.serviceCategory, dateObj)
      alert('Date blocked successfully!')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error blocking date:', error)
      alert('Failed to block date')
    } finally {
      setSaving(false)
    }
  }

  const handleUnblockDate = async () => {
    setSaving(true)
    try {
      const dateObj = parseDateKey(date)
      await unblockDate(serviceId, dateObj)
      alert('Date unblocked successfully!')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error unblocking date:', error)
      alert('Failed to unblock date')
    } finally {
      setSaving(false)
    }
  }

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.eventType || !newEvent.startTime || !newEvent.endTime) {
      alert('Please fill all required event details')
      return
    }

    setSaving(true)
    try {
      const dateObj = parseDateKey(date)
      
      const event: CalendarEvent = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: newEvent.title,
        eventType: newEvent.eventType,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        deleteAllowed: mode === 'vendor',
        ...(newEvent.customerName && { customerName: newEvent.customerName }),
        ...(newEvent.customerPhone && { customerPhone: newEvent.customerPhone }),
        ...(newEvent.customerAltPhone && { customerAltPhone: newEvent.customerAltPhone }),
        ...(newEvent.customerAddress && { customerAddress: newEvent.customerAddress }),
        ...(newEvent.additionalNotes && { additionalNotes: newEvent.additionalNotes })
      }

      await addEventToDate(
        serviceId, 
        service.vendorId, 
        service.cityId, 
        service.serviceCategory, 
        dateObj, 
        event
      )
      
      setNewEvent({ 
        title: '', 
        eventType: '', 
        startTime: '00:01', 
        endTime: '23:59',
        customerName: '',
        customerPhone: '',
        customerAltPhone: '',
        customerAddress: '',
        additionalNotes: ''
      })
      setShowAddEvent(false)
      alert('Event added successfully!')
      onUpdate()
      fetchDateData()
    } catch (error) {
      console.error('Error adding event:', error)
      alert('Failed to add event')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    // Find the event to check deleteAllowed
    const eventToDelete = events.find(evt => evt.id === eventId)
    
    // If vendor mode and event is not deletable, show error
    if (mode === 'vendor' && eventToDelete?.deleteAllowed === false) {
      alert('This event cannot be deleted. Please contact customer support.')
      return
    }
    
    if (!confirm('Are you sure you want to delete this event?')) return

    setSaving(true)
    try {
      const dateObj = parseDateKey(date)
      await removeEventFromDate(serviceId, dateObj, eventId, mode === 'admin')
      alert('Event deleted successfully!')
      onUpdate()
      fetchDateData()
    } catch (error: any) {
      console.error('Error deleting event:', error)
      alert(error.message || 'Failed to delete event')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const dateObj = parseDateKey(date)
  const formattedDate = dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">{formattedDate}</h3>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
            <MdClose className="text-xl text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
            </div>
          ) : (
            <>
              {/* Status Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Date Status</h4>
                <div className="flex gap-3">
                  {status === 'available' && (
                    <button
                      onClick={handleBlockDate}
                      disabled={saving}
                      className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <MdBlock className="text-xl" />
                      Block Date
                    </button>
                  )}
                  {status === 'blocked' && (
                    <button
                      onClick={handleUnblockDate}
                      disabled={saving}
                      className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <MdCheckCircle className="text-xl" />
                      Unblock Date
                    </button>
                  )}
                  {status === 'booked' && (
                    <div className="flex-1 py-3 bg-red-100 text-red-700 font-semibold rounded-lg border-2 border-red-300 flex items-center justify-center gap-2">
                      <MdCheckCircle className="text-xl" />
                      This date is booked
                    </div>
                  )}
                </div>
              </div>

              {/* Events Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-900">Events</h4>
                  {status !== 'blocked' && (
                    <button
                      onClick={() => setShowAddEvent(!showAddEvent)}
                      className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                    >
                      <MdAdd className="text-xl" />
                      Add Event
                    </button>
                  )}
                </div>

                {/* Add Event Form */}
                {showAddEvent && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Event Title"
                          value={newEvent.title}
                          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Event Type <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Wedding, Birthday"
                          value={newEvent.eventType}
                          onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Optional Customer Fields */}
                      <div className="pt-3 border-t border-gray-300">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Customer Details (Optional)</h5>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Customer Name
                            </label>
                            <input
                              type="text"
                              placeholder="Customer Name"
                              value={newEvent.customerName}
                              onChange={(e) => setNewEvent({ ...newEvent, customerName: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                placeholder="Phone Number"
                                value={newEvent.customerPhone}
                                onChange={(e) => setNewEvent({ ...newEvent, customerPhone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-1">
                                Alternative Phone
                              </label>
                              <input
                                type="tel"
                                placeholder="Alternative Phone"
                                value={newEvent.customerAltPhone}
                                onChange={(e) => setNewEvent({ ...newEvent, customerAltPhone: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Customer Address
                            </label>
                            <input
                              type="text"
                              placeholder="Customer Address"
                              value={newEvent.customerAddress}
                              onChange={(e) => setNewEvent({ ...newEvent, customerAddress: e.target.value })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Additional Notes
                            </label>
                            <textarea
                              placeholder="Additional Notes"
                              value={newEvent.additionalNotes}
                              onChange={(e) => setNewEvent({ ...newEvent, additionalNotes: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddEvent}
                          disabled={saving}
                          className="flex-1 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                          Save Event
                        </button>
                        <button
                          onClick={() => {
                            setShowAddEvent(false)
                            setNewEvent({ 
                              title: '', 
                              eventType: '', 
                              startTime: '00:01', 
                              endTime: '23:59',
                              customerName: '',
                              customerPhone: '',
                              customerAltPhone: '',
                              customerAddress: '',
                              additionalNotes: ''
                            })
                          }}
                          className="flex-1 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Events List */}
                {events.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No events scheduled for this date</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{event.title}</h5>
                            <p className="text-sm text-gray-600">{event.eventType}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.startTime} - {event.endTime}
                            </p>
                            {(event.customerName || event.customerPhone || event.customerAddress) && (
                              <div className="mt-2 pt-2 border-t border-purple-200">
                                {event.customerName && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Customer:</span> {event.customerName}
                                  </p>
                                )}
                                {event.customerPhone && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Phone:</span> {event.customerPhone}
                                  </p>
                                )}
                                {event.customerAltPhone && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Alt Phone:</span> {event.customerAltPhone}
                                  </p>
                                )}
                                {event.customerAddress && (
                                  <p className="text-sm text-gray-600">
                                    <span className="font-medium">Address:</span> {event.customerAddress}
                                  </p>
                                )}
                                {event.additionalNotes && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <span className="font-medium">Notes:</span> {event.additionalNotes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          {(mode === 'admin' || event.deleteAllowed !== false) && (
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={saving}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                              title={mode === 'admin' ? 'Delete event (Admin)' : 'Delete event'}
                            >
                              <MdDelete className="text-xl" />
                            </button>
                          )}
                          {mode === 'vendor' && event.deleteAllowed === false && (
                            <div className="p-2 text-gray-400" title="This event cannot be deleted. Contact customer support.">
                              <MdDelete className="text-xl" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
